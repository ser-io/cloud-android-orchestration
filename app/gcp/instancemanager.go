// Copyright 2022 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package gcp

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"

	apiv1 "cloud-android-orchestration/api/v1"
	"cloud-android-orchestration/app"

	compute "cloud.google.com/go/compute/apiv1"
	"github.com/google/uuid"
	"google.golang.org/api/iterator"
	"google.golang.org/api/option"
	computepb "google.golang.org/genproto/googleapis/cloud/compute/v1"
	"google.golang.org/protobuf/proto"
)

const (
	namePrefix           = "cf-"
	labelPrefix          = "cf-"
	labelAcloudCreatedBy = "created_by" // required for acloud backwards compatibility
	labelCreatedBy       = labelPrefix + "created_by"
)

// GCP implementation of the instance manager.
type InstanceManager struct {
	config      *app.IMConfig
	client      *compute.InstancesClient
	uuidFactory func() string
}

func NewInstanceManager(config *app.IMConfig, ctx context.Context, opts ...option.ClientOption) (*InstanceManager, error) {
	client, err := compute.NewInstancesRESTClient(ctx, opts...)
	if err != nil {
		return nil, err
	}
	return &InstanceManager{
		config:      config,
		client:      client,
		uuidFactory: func() string { return uuid.New().String() },
	}, nil
}

func (m *InstanceManager) GetHostAddr(zone string, host string) (string, error) {
	instance, err := m.getHostInstance(zone, host)
	if err != nil {
		return "", err
	}
	ilen := len(instance.NetworkInterfaces)
	if ilen == 0 {
		log.Printf("host instance %s in zone %s is missing a network interface", host, zone)
		return "", app.NewInternalError("host instance missing a network interface", nil)
	}
	if ilen > 1 {
		log.Printf("host instance %s in zone %s has %d network interfaces", host, zone, ilen)
	}
	return *instance.NetworkInterfaces[0].NetworkIP, nil
}

func (m *InstanceManager) CreateHost(zone string, req *apiv1.CreateHostRequest, user app.UserInfo) (*apiv1.Operation, error) {
	if err := validateRequest(req); err != nil {
		return nil, err
	}
	labels := map[string]string{
		labelAcloudCreatedBy: user.Username(),
		labelCreatedBy:       user.Username(),
	}
	ctx := context.TODO()
	computeReq := &computepb.InsertInstanceRequest{
		Project: m.config.GCP.ProjectID,
		Zone:    zone,
		InstanceResource: &computepb.Instance{
			Name:           proto.String(namePrefix + m.uuidFactory()),
			MachineType:    proto.String(req.CreateHostInstanceRequest.GCP.MachineType),
			MinCpuPlatform: proto.String(req.CreateHostInstanceRequest.GCP.MinCPUPlatform),
			Disks: []*computepb.AttachedDisk{
				{
					InitializeParams: &computepb.AttachedDiskInitializeParams{
						DiskSizeGb:  proto.Int64(int64(req.CreateHostInstanceRequest.GCP.DiskSizeGB)),
						SourceImage: proto.String(m.config.GCP.HostImage),
					},
					Boot: proto.Bool(true),
				},
			},
			NetworkInterfaces: []*computepb.NetworkInterface{
				{
					Name: proto.String(buildDefaultNetworkName(m.config.GCP.ProjectID)),
					AccessConfigs: []*computepb.AccessConfig{
						{
							Name: proto.String("External NAT"),
							Type: proto.String(computepb.AccessConfig_ONE_TO_ONE_NAT.String()),
						},
					},
				},
			},
			Labels: labels,
		},
	}
	op, err := m.client.Insert(ctx, computeReq)
	if err != nil {
		return nil, err
	}
	result := &apiv1.Operation{
		Name: op.Name(),
		Done: op.Done(),
	}
	return result, nil
}

func (m *InstanceManager) ListHosts(zone string, user app.UserInfo) (apiv1.ListHostsResponse, error) {
	var hosts []apiv1.HostInstance
	ctx := context.TODO()
	req := &computepb.ListInstancesRequest{
		Project: m.config.GCP.ProjectID,
		Zone:    zone,
		Filter:  proto.String("labels.cf-created_by:" + user.Username()),
	}
	it := m.client.List(ctx, req)
	for {
		instance, err := it.Next()
		if err == iterator.Done {
			break
		}
		hosts = append(hosts, BuildHostInstance(instance))
	}
	return apiv1.ListHostsResponse{Hosts: hosts}, nil
}

type Operation struct {
	Name string `json:"name"`
	// If the value is `false`, it means the operation is still in progress.
	// If `true`, the operation is completed, and either `error` or `response` is
	// available.
	Done bool `json:"done"`
	// Result will contain either an error or a result object but never both.
	Result *OperationResult `json:"result,omitempty"`
}

type OperationResult struct {
	Error *ErrorMsg `json:"error,omitempty"`
}

type ErrorMsg struct {
	Error string `json:"error"`
}

func (m *InstanceManager) CreateCVD(zone, host string, req apiv1.CreateCVDRequest, user app.UserInfo) (apiv1.Operation, error) {
	hostAddr, err := m.GetHostAddr(zone, host)
	if err != nil {
		return apiv1.Operation{}, err
	}
	hostReq := struct {
		BuildInfo struct {
			BuildID string `json:"build_id"`
			Target  string `json:"target"`
		} `json:"build_info"`
		FetchCVDBuildID string `json:"fetch_cvd_build_id"`
	}{
		BuildInfo: struct {
			BuildID string `json:"build_id"`
			Target  string `json:"target"`
		}{
			BuildID: req.BuildInfo.BuildID,
			Target:  req.BuildInfo.Target,
		},
		FetchCVDBuildID: "8687975",
	}
	var resErr apiv1.ErrorMsg
	var op Operation
	_, err = POSTRequest(hostURL(hostAddr, "/devices", ""), hostReq, &op, &resErr)
	if err != nil {
		return apiv1.Operation{}, err
	}
	if resErr.Error != "" {
		log.Println("The device host returned an error: ", resErr.Error)
		return apiv1.Operation{}, errors.New(resErr.Error)
	}
	log.Printf("operation returned %+v\n", op)
	result := apiv1.Operation{
		Name: op.Name,
		Done: op.Done,
	}
	if op.Result != nil && op.Result.Error != nil {
		result.Result = &apiv1.Result{
			Error: apiv1.Error{
				Message: op.Result.Error.Error,
			},
		}
	}
	return result, nil
}

func (m *InstanceManager) GetCVDOperation(zone, host, name string) (apiv1.Operation, error) {
	log.Println("HERE")
	hostAddr, err := m.GetHostAddr(zone, host)
	if err != nil {
		return apiv1.Operation{}, err
	}
	var resErr apiv1.ErrorMsg
	var op Operation
	url := hostURL(hostAddr, "/operations/"+name, "")
	log.Println(url)
	_, err = GETRequest(url, &op, &resErr)
	log.Printf("op %+v\n", op)
	if err != nil {
		return apiv1.Operation{}, err
	}
	if resErr.Error != "" {
		log.Println("The device host returned an error: ", resErr.Error)
		return apiv1.Operation{}, errors.New(resErr.Error)
	}
	result := apiv1.Operation{
		Name: op.Name,
		Done: op.Done,
	}
	if op.Result != nil && op.Result.Error != nil {
		result.Result = &apiv1.Result{
			Error: apiv1.Error{
				Message: op.Result.Error.Error,
			},
		}
	}
	return result, nil
}

func (m *InstanceManager) Close() error {
	return m.client.Close()
}

func (m *InstanceManager) getHostInstance(zone string, host string) (*computepb.Instance, error) {
	ctx := context.TODO()
	req := &computepb.GetInstanceRequest{
		Project:  m.config.GCP.ProjectID,
		Zone:     zone,
		Instance: host,
	}
	return m.client.Get(ctx, req)
}

func validateRequest(r *apiv1.CreateHostRequest) error {
	if r.CreateHostInstanceRequest == nil ||
		r.CreateHostInstanceRequest.GCP == nil ||
		r.CreateHostInstanceRequest.GCP.DiskSizeGB == 0 ||
		r.CreateHostInstanceRequest.GCP.MachineType == "" {
		return app.NewBadRequestError("invalid CreateHostRequest", nil)
	}
	return nil
}

func buildDefaultNetworkName(projectID string) string {
	return fmt.Sprintf("projects/%s/global/networks/default", projectID)
}

// Internal setter method used for testing only.
func (m *InstanceManager) setUUIDFactory(newFactory func() string) {
	m.uuidFactory = newFactory
}

func hostURL(addr string, path string, query string) string {
	url := "http://" + addr + ":1080" + path
	if query != "" {
		url += "?" + query
	}
	return url
}

func GETRequest(url string, resObj interface{}, resErr *apiv1.ErrorMsg) (int, error) {
	res, err := http.Get(url)
	if err != nil {
		return -1, fmt.Errorf("Failed to connect to device host: %w", err)
	}
	defer res.Body.Close()
	return parseReply(res, resObj, resErr)
}

// Returns the http response's status code or an error.
// If the status code indicates success (in the 2xx range) the response will be
// in resObj, otherwise resErr will contain the error message.
func POSTRequest(url string, msg interface{}, resObj interface{}, resErr *apiv1.ErrorMsg) (int, error) {
	jsonBody, err := json.Marshal(msg)
	if err != nil {
		return -1, fmt.Errorf("Failed to parse JSON request: %w", err)
	}
	reqBody := bytes.NewBuffer(jsonBody)
	res, err := http.Post(url, "application/json", reqBody)
	if err != nil {
		return -1, fmt.Errorf("Failed to connecto to device host: %w", err)
	}
	defer res.Body.Close()
	return parseReply(res, resObj, resErr)
}

func parseReply(res *http.Response, resObj interface{}, resErr *apiv1.ErrorMsg) (int, error) {
	var err error
	dec := json.NewDecoder(res.Body)
	if res.StatusCode < 200 || res.StatusCode > 299 {
		err = dec.Decode(resErr)
	} else {
		err = dec.Decode(resObj)
	}
	if err != nil {
		return -1, fmt.Errorf("Failed to parse device response: %w", err)
	}
	return res.StatusCode, nil
}

func BuildHostInstance(in *computepb.Instance) apiv1.HostInstance {
	return apiv1.HostInstance{
		Name: in.GetName(),
		GCP: &apiv1.GCPInstance{
			// DiskSizeGB:
			MachineType:    *in.MachineType,
			MinCPUPlatform: *in.MinCpuPlatform,
		},
	}
}
