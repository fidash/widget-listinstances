#List Instances Widget

This project is part of [FIWARE](https://www.fiware.org/). This widget is part of FI-Dash component included in FIWARE.

The widget displays a list of instances available to the user in FIWARE's Cloud. The widget also has multi-region support and allows the creation of new instances.


## Wiring endpoints

The List Instances widget has the following wiring endpoints:

|Way|Name|Type|Description|Label|Friendcode|
|:--:|:--:|:--:|:--:|:--:|:--:|
|output|image_id|text|Sends image ID and OpenStack access.|Image ID|image_id|
|output|instance_id|text|Sends instance ID and OpenStack access.|Instance ID|instance_id|


## User preferences

List Instances has the following preferences:

|Name|Type|Description|Label|Default|
|:--:|:--:|:--:|:--:|:--:|
|task|boolean|Activate to display the task column|Task|true|
|power_state|boolean|Activate to display the power state column|Power State|true|
|vm_state|boolean|Activate to display the vm state column|VM State|false|
|disk_config|boolean|Activate to display the disk config column|Disk Config|false|
|flavor|boolean|Activate to display the flavor column|Flavor|false|
|key_pair|boolean|Activate to display the key pair column|Key Pair|false|
|image|boolean|Activate to display the image column|Image|false|
|owner|boolean|Activate to display the owner column|Owner|false|
|updated|boolean|Activate to display the updated column|Updated|false|
|created|boolean|Activate to display the created column|Created|false|
|addresses|boolean|Activate to display the addresses column|Addresses|true|
|tenant|boolean|Activate to display the tenant column|Tenant|false|
|status|boolean|Activate to display the status column|Status|true|
|name|boolean|Activate to display the name column|Name|true|
|id|boolean|Activate to display the id column|ID|false|
