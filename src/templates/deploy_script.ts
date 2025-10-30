export const DEPLOY_SCRIPT_TEMPLATE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

{{ for c of contracts }}
import { {{ c.name }} } from "../src/{{ c.name }}.sol";
{{ /for }}

contract Deploy is Script {
{{ for c of contracts }}
    {{ c.name }} {{ c.instanceName }};
{{ /for }}

    function run() external {
        vm.startBroadcast();
{{ for c of contracts }}
        {{ c.instanceName }} = new {{ c.name }}();
        console.log(string.concat("DEPLOYED:", "{{ c.name }}", ":", vm.toString(address({{ c.instanceName }}))));
{{ /for }}
        vm.stopBroadcast();
    }
}
`;


