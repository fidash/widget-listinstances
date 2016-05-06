#List Instances Widget

[![GitHub license](https://img.shields.io/badge/license-AGPLv3-blue.svg)](https://raw.githubusercontent.com/fidash/widget-listinstances/master/LICENSE.txt)
[![Build Status](https://build.conwet.fi.upm.es/jenkins/view/FI-Dash/job/Widget%20ListInstances/badge/icon)](https://build.conwet.fi.upm.es/jenkins/view/FI-Dash/job/Widget%20ListInstances/)

This project is part of [FIWARE](https://www.fiware.org/). This widget is part of FI-Dash component included in FIWARE.

The widget displays a list of instances available to the user in FIWARE's Cloud. The widget also has multi-region support and allows the creation of new instances.


## Wiring endpoints

The List Instances widget has the following wiring endpoints:

|Label|Name|Friendcode|Type|Description|
|:--:|:--:|:--:|:--:|:--|
|Authentication|authentication|openstack-auth|text|Receive the authentication data via wiring.|
|Image ID|image_id|image_id|text|Sends image ID and OpenStack access.|
|Instance ID|instance_id|instance_id|text|Sends instance ID and OpenStack access.|


## User preferences

List Instances has the following preferences:

|Label|Name|Type|Default|Description|
|:--:|:--:|:--:|:--:|:--|
|Task|task|boolean|true|Activate to display the task column|
|Power State|power_state|boolean|true|Activate to display the power state column|
|VM State|vm_state|boolean|false|Activate to display the vm state column|
|Disk Config|disk_config|boolean|false|Activate to display the disk config column|
|Flavor|flavor|boolean|false|Activate to display the flavor column|
|Key Pair|key_pair|boolean|false|Activate to display the key pair column|
|Image|image|boolean|false|Activate to display the image column|
|Owner|owner|boolean|false|Activate to display the owner column|
|Updated|updated|boolean|false|Activate to display the updated column|
|Created|created|boolean|false|Activate to display the created column|
|Addresses|addresses|boolean|true|Activate to display the addresses column|
|Tenant|tenant|boolean|false|Activate to display the tenant column|
|Status|status|boolean|true|Activate to display the status column|
|Name|name|boolean|true|Activate to display the name column|
|ID|id|boolean|false|Activate to display the id column|
