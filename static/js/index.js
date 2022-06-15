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
  console.log("create host button clicked")
  var url = "/v1/zones/us-central1-b/hosts"
  var xhr = new XMLHttpRequest();
  xhr.open("POST", url, false); // false for synchronous request
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send(JSON.stringify({
      create_host_instance_request: {
        gcp: {
          disk_size_gb: 30,                                                                                                                                                                                                                                                       
          machine_type: "zones/us-central1-b/machineTypes/n1-standard-4",                                                                                                                                                                                                         
          min_cpu_platform: "Intel Haswell"
        }
      }
  }));
  console.log(xhr.responseText)
  document.getElementById('response').value = xhr.responseText;
});

document.getElementById("list-hosts").addEventListener("click", function() {
  var host = document.getElementById("hostname").value
  var url = "v1/zones/us-central1-b/hosts"
  var xhr = new XMLHttpRequest();
  xhr.open( "GET", url, false ); // false for synchronous request
  xhr.send( null );
  console.log(xhr.responseText)
  document.getElementById('response').value = xhr.responseText
});

document.getElementById("create-cvd").addEventListener("click", function() {
  console.log("create cvd button clicked")
  var host = document.getElementById("hostname").value
  console.log("host: " + host)
  var url = "v1/zones/us-central1-b/hosts/" + host  + "/cvds"
  console.log("request url:" + url)
  var xhr = new XMLHttpRequest();
  xhr.open("POST", url, false); // false for synchronous request
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send(JSON.stringify({
    build_info: {                                                               
      build_id: "8673413",
      target: "aosp_cf_x86_64_phone-userdebug"                                                       
    },                                                                          
  }));
  console.log(xhr.responseText)
  document.getElementById('response').value = xhr.responseText;
});

document.getElementById("get-cvds").addEventListener("click", function() {
  var host = document.getElementById("hostname").value
  var url = "v1/zones/us-central1-b/hosts/" + host  + "/devices"
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open( "GET", url, false ); // false for synchronous request
  xmlHttp.send( null );
  console.log(xmlHttp.responseText)
  document.getElementById('response').value = xmlHttp.responseText
});

document.getElementById("get-cvd-operations").addEventListener("click", function() {
  console.log("get cvd operations button clicked")
  var host = document.getElementById("hostname").value
  var url = "v1/zones/us-central1-b/hosts/" + host  + "/operations"
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open( "GET", url, false ); // false for synchronous request
  xmlHttp.send( null );
  console.log(xmlHttp.responseText)
  document.getElementById('response').value = xmlHttp.responseText
});

document.getElementById("get-cvd-operation").addEventListener("click", function() {
  console.log("get cvd operation button clicked")
  var host = document.getElementById("hostname").value
  var name = document.getElementById("operation-name").value
  console.log("host: " + host)
  console.log("name: " + name)
  var url = "v1/zones/us-central1-b/hosts/" + host  + "/operations/" + name 
  console.log("request url:" + url)
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open( "GET", url, false ); // false for synchronous request
  xmlHttp.send( null );
  console.log(xmlHttp.responseText)
  document.getElementById('response').value = xmlHttp.responseText
});
