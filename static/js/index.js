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

function prependResponse(response) {
  var current = document.getElementById('response').value
  document.getElementById('response').value =
    response + "\n\n----------------------------------------------\n\n" + current 
}

function updateWebrtcLink() {
  const zone = "us-central1-b";
  const host = document.getElementById("hostname").value;
  const deviceId = document.getElementById("cvd-name").value;
  const path = deviceId != ""?
    `/v1/zones/${zone}/hosts/${host}/devices/${deviceId}/files/client.html`:
    'CVD name is empty';
  let link = document.getElementById('webrtc-link');
  link.textContent = path;
  link.href = path;
}


window.onload = e => {

  document.getElementById("create-host").addEventListener("click", function() {
    var url = "/v1/zones/us-central1-b/hosts"
    var payload = {
      create_host_instance_request: {
        gcp: {
          disk_size_gb: 30,                                                                                                                                                                                                                                                       
          machine_type: "zones/us-central1-b/machineTypes/n1-standard-4",                                                                                                                                                                                                         
          min_cpu_platform: "Intel Haswell"
        }
      }
    }
    fetch(url, { method: "POST", body: JSON.stringify(payload) })
      .then(response => response.json())
      .then(data => {
        prependResponse(JSON.stringify(data, null, 4))
      });
  });

  document.getElementById("list-hosts").addEventListener("click", function() {
    var url = "v1/zones/us-central1-b/hosts"
    fetch(url)
      .then(response => response.json())
      .then(data => {
        prependResponse(JSON.stringify(data, null, 4))
      });
  });

  document.getElementById("create-cvd").addEventListener("click", function() {
    var host = document.getElementById("hostname").value
    var url = "v1/zones/us-central1-b/hosts/" + host  + "/cvds"
    var payload = {
      build_info: {                                                               
        build_id: document.getElementById("cvd-buildid").value,
        target: document.getElementById("cvd-target").value,
      }                                                                          
    }
    fetch(url, { method: "POST", body: JSON.stringify(payload) })
      .then(response => response.json())
      .then(data => {
        prependResponse(JSON.stringify(data, null, 4))
      });
  });

  document.getElementById("get-cvds").addEventListener("click", function() {
    var host = document.getElementById("hostname").value
    var url = "v1/zones/us-central1-b/hosts/" + host  + "/devices"
    fetch(url)
      .then(response => response.json())
      .then(data => {
        prependResponse(JSON.stringify(data, null, 4))
      });
  });

  document.getElementById("get-cvd-operations").addEventListener("click", function() {
    var host = document.getElementById("hostname").value
    var url = "v1/zones/us-central1-b/hosts/" + host  + "/operations"
    fetch(url)
      .then(response => response.json())
      .then(data => {
        prependResponse(JSON.stringify(data, null, 4))
      });
  });

  document.getElementById("get-cvd-operation").addEventListener("click", function() {
    var host = document.getElementById("hostname").value
    var operationName = document.getElementById("cvd-operation-name").value
    var url = "v1/zones/us-central1-b/hosts/" + host  + "/operations/" + operationName
    fetch(url)
      .then(response => response.json())
      .then(data => {
        prependResponse(JSON.stringify(data, null, 4))
      });
  });

  document.querySelectorAll('.incvdpath').forEach(i => i.addEventListener('input', updateWebrtcLink));
}
