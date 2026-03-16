import { registerCommand, type StateChange } from "./index";

registerCommand("ip", (args, state) => {
  if (args.length === 0) {
    return { stdout: "", stderr: "Usage: ip [ OPTIONS ] OBJECT { COMMAND }\n", exitCode: 1 };
  }

  const subcommand = args[0];

  // ip link
  if (subcommand === "link") {
    if (args[1] === "set" && args.length >= 4) {
      const ifName = args[2];
      const action = args[3]; // "up" or "down"
      const iface = state.network.interfaces.find(i => i.name === ifName);
      if (!iface) {
        return { stdout: "", stderr: `Cannot find device "${ifName}"\n`, exitCode: 1 };
      }
      const newState = action === "up" ? "UP" : "DOWN";
      const sideEffects: StateChange[] = [
        { type: "set-interface-state", payload: { name: ifName, state: newState } },
      ];
      // Update operstate file
      sideEffects.push({
        type: "write-file",
        payload: { path: `/sys/class/net/${ifName}/operstate`, content: action === "up" ? "up" : "down" },
      });
      return { stdout: "", stderr: "", exitCode: 0, sideEffects };
    }

    // ip link show
    const lines: string[] = [];
    for (let i = 0; i < state.network.interfaces.length; i++) {
      const iface = state.network.interfaces[i];
      const flags = iface.state === "UP" ? "UP,LOWER_UP" : "NO-CARRIER";
      lines.push(`${i + 1}: ${iface.name}: <${flags}> mtu 1500 state ${iface.state}`);
      if (iface.mac) {
        lines.push(`    link/ether ${iface.mac} brd ff:ff:ff:ff:ff:ff`);
      }
    }
    return { stdout: lines.join("\n") + "\n", stderr: "", exitCode: 0 };
  }

  // ip addr
  if (subcommand === "addr" || subcommand === "address") {
    if (args[1] === "add" && args.length >= 4) {
      const ipAddr = args[2]; // e.g., "192.168.1.100/24"
      const devIdx = args.indexOf("dev");
      const ifName = devIdx >= 0 ? args[devIdx + 1] : undefined;
      if (!ifName) {
        return { stdout: "", stderr: "ip: missing device name\n", exitCode: 1 };
      }
      const ip = ipAddr.split("/")[0];
      return {
        stdout: "",
        stderr: "",
        exitCode: 0,
        sideEffects: [{ type: "set-interface-ip", payload: { name: ifName, ip } }],
      };
    }

    // ip addr show
    const lines: string[] = [];
    for (let i = 0; i < state.network.interfaces.length; i++) {
      const iface = state.network.interfaces[i];
      const flags = iface.state === "UP" ? "UP,LOWER_UP" : "NO-CARRIER";
      lines.push(`${i + 1}: ${iface.name}: <${flags}> mtu 1500 state ${iface.state}`);
      if (iface.mac) {
        lines.push(`    link/ether ${iface.mac} brd ff:ff:ff:ff:ff:ff`);
      }
      if (iface.ip) {
        lines.push(`    inet ${iface.ip}/${iface.mask ?? "24"} scope global ${iface.name}`);
      }
    }
    return { stdout: lines.join("\n") + "\n", stderr: "", exitCode: 0 };
  }

  // ip route
  if (subcommand === "route") {
    if (args[1] === "add") {
      // ip route add default via 192.168.1.1
      return { stdout: "", stderr: "", exitCode: 0 };
    }

    const routes = state.network.routes ?? [];
    const lines = routes.map(r =>
      `${r.destination} via ${r.gateway} dev ${r.interface}`
    );
    return { stdout: lines.join("\n") + (lines.length > 0 ? "\n" : ""), stderr: "", exitCode: 0 };
  }

  return { stdout: "", stderr: `ip: unknown subcommand '${subcommand}'\n`, exitCode: 1 };
});

registerCommand("ss", (args, state) => {
  const showListening = args.includes("-l") || args.includes("-lt") || args.includes("-ltn");
  const showTcp = args.includes("-t") || args.includes("-lt") || args.includes("-ltn");

  const header = "State    Recv-Q Send-Q  Local Address:Port   Peer Address:Port\n";
  const lines: string[] = [header.trimEnd()];

  if (showListening) {
    lines.push("LISTEN   0      128     0.0.0.0:22            0.0.0.0:*");
  }

  return { stdout: lines.join("\n") + "\n", stderr: "", exitCode: 0 };
});

registerCommand("ping", (args, state) => {
  let count = 1;
  const cIdx = args.indexOf("-c");
  if (cIdx >= 0 && args[cIdx + 1]) count = parseInt(args[cIdx + 1], 10);
  const host = args.filter(a => !a.startsWith("-") && args.indexOf(a) !== cIdx + 1)[0];

  if (!host) {
    return { stdout: "", stderr: "ping: usage error\n", exitCode: 1 };
  }

  // Check if host is reachable (simplified: any UP interface with an IP)
  const hasNetwork = state.network.interfaces.some(i => i.state === "UP" && i.ip);

  if (!hasNetwork && host !== "127.0.0.1" && host !== "localhost") {
    return {
      stdout: `PING ${host} (${host}) 56(84) bytes of data.\n\n--- ${host} ping statistics ---\n${count} packets transmitted, 0 received, 100% packet loss\n`,
      stderr: "",
      exitCode: 1,
    };
  }

  const lines = [`PING ${host} (${host}) 56(84) bytes of data.`];
  for (let i = 0; i < count; i++) {
    lines.push(`64 bytes from ${host}: icmp_seq=${i + 1} ttl=64 time=0.5 ms`);
  }
  lines.push(`\n--- ${host} ping statistics ---`);
  lines.push(`${count} packets transmitted, ${count} received, 0% packet loss, time 0ms`);

  return { stdout: lines.join("\n") + "\n", stderr: "", exitCode: 0 };
});
