/*
 * Copyright (C) 2019 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const DEFAULT_ZONE = "us-central1-b";

function prependResponse(response) {
  var current = document.getElementById('response').value
  document.getElementById('response').value =
    response + "\n\n----------------------------------------------\n\n" + current 
}

function getWebrtcLink(host, deviceId, zone = DEFAUL_ZONE) {
    return `/v1/zones/${zone}/hosts/${host}/devices/${deviceId}/files/client.html`;
}

function updateWebrtcLink() {
  const zone = "us-central1-b";
  const host = document.getElementById("hostname").value;
  const deviceId = document.getElementById("cvd-name").value;
  const path = deviceId != ""?
    getWebRtcLink(host, deviceId, zone):
    'CVD name is empty';
  let link = document.getElementById('webrtc-link');
  link.textContent = path;
  link.href = path;
}

function createHost(zone = DEFAULT_ZONE, diskSizeGb = 30, machineType = "n1-standard-4") {
  var url = `/v1/zones/${zone}/hosts`;
  var payload = {
    create_host_instance_request: {
      gcp: {
        disk_size_gb: diskSizeGb,
        machine_type: `zones/${zone}/machineTypes/${machineType}`,
        min_cpu_platform: "Intel Haswell"
      }
    }
  };
  return fetch(url, { method: "POST", body: JSON.stringify(payload) })
    .then(response => response.json());
}

function listHosts(zone = DEFAULT_ZONE) {
  var url = `v1/zones/${zone}/hosts`;
  return fetch(url)
    .then(response => response.json());
}

function createCVD(host, buildId = "8673413", target = "aosp_cf_x86_64_phone-userdebug", zone = DEFAULT_ZONE) {
  var url = `v1/zones/${zone}/hosts/${host}/cvds`;
  var payload = {
    build_info: {
      build_id: buildId,
      target: target,
    }
  };
  return fetch(url, { method: "POST", body: JSON.stringify(payload) })
    .then(response => response.json());
}

function getCVDs(host, zone = DEFAULT_ZONE) {
    var url = `v1/zones/${zone}/hosts/${host}/devices`;
    return fetch(url)
      .then(response => response.json());
}

function getOperations(host, zone = DEFAULT_ZONE) {
    var url = `v1/zones/${zone}/hosts/${host}/operations`;
    return fetch(url)
      .then(response => response.json());
}

function getOperation(operationName, host, zone = DEFAULT_ZONE) {
    var url = `v1/zones/${zone}/hosts/${host}/operations/${operationName}`;
    return fetch(url)
      .then(response => response.json());
}

window.onload = e => {

  document.getElementById("create-host").addEventListener("click", function() {
    createHost().then(data => {
      prependResponse(JSON.stringify(data, null, 4))
    });
  });

  document.getElementById("list-hosts").addEventListener("click", function() {
    listHosts().then(data => {
      prependResponse(JSON.stringify(data, null, 4))
    });
  });

  document.getElementById("create-cvd").addEventListener("click", function() {
    var host = document.getElementById("hostname").value
    var buildId = document.getElementById("cvd-buildid").value;
    var target = document.getElementById("cvd-target").value;
    createCVD(host, buildId, target).then(data => {
        prependResponse(JSON.stringify(data, null, 4))
      });
  });

  document.getElementById("get-cvds").addEventListener("click", function() {
    var host = document.getElementById("hostname").value
    getCVDs(host).then(data => {
        prependResponse(JSON.stringify(data, null, 4))
      });
  });

  document.getElementById("get-cvd-operations").addEventListener("click", function() {
    var host = document.getElementById("hostname").value
    getOperations(host).then(data => {
        prependResponse(JSON.stringify(data, null, 4))
      });
  });

  document.getElementById("get-cvd-operation").addEventListener("click", function() {
    var host = document.getElementById("hostname").value
    var operationName = document.getElementById("cvd-operation-name").value
    getOperation(host, operationName).then(data => {
        prependResponse(JSON.stringify(data, null, 4))
      });
  });

  document.querySelectorAll('.incvdpath').forEach(i => i.addEventListener('input', updateWebrtcLink));
}
