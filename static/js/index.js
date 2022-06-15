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
      document.getElementById('response').value = JSON.stringify(data, null, 4)
    });
});

document.getElementById("list-hosts").addEventListener("click", function() {
  var host = document.getElementById("hostname").value
  var url = "v1/zones/us-central1-b/hosts"
  fetch(url)
    .then(response => response.json())
    .then(data => {
      document.getElementById('response').value = JSON.stringify(data, null, 4)
    });
});

document.getElementById("create-cvd").addEventListener("click", function() {
  var host = document.getElementById("hostname").value
  var url = "v1/zones/us-central1-b/hosts/" + host  + "/cvds"
  var payload = {
    build_info: {                                                               
      build_id: "8673413",
      target: "aosp_cf_x86_64_phone-userdebug"                                                       
    }                                                                          
  }
  fetch(url, { method: "POST", body: JSON.stringify(payload) })
    .then(response => response.json())
    .then(data => {
      document.getElementById('response').value = JSON.stringify(data, null, 4)
    });
});

document.getElementById("get-cvds").addEventListener("click", function() {
  var host = document.getElementById("hostname").value
  var url = "v1/zones/us-central1-b/hosts/" + host  + "/devices"
  fetch(url)
    .then(response => response.json())
    .then(data => {
      document.getElementById('response').value = JSON.stringify(data, null, 4)
    });
});

document.getElementById("get-cvd-operations").addEventListener("click", function() {
  var host = document.getElementById("hostname").value
  var url = "v1/zones/us-central1-b/hosts/" + host  + "/operations"
  fetch(url)
    .then(response => response.json())
    .then(data => {
      document.getElementById('response').value = JSON.stringify(data, null, 4)
    });
});

