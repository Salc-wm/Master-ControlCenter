#!/usr/bin/env node
/**
 * StackDash native messaging host (Node.js example)
 * StdIO protocol: each message is a 4-byte little-endian length + JSON payload.
 * SECURITY: Very minimal; only executes whitelisted commands.
 */

const ALLOWED = new Set([
  'wireshark',
  'notepad',
  'code',
  'calc'
]);

const { spawn } = require('child_process');

function readMessage() {
  const header = process.stdin.read(4);
  if (!header) return null;
  const len = header.readUInt32LE(0);
  const body = process.stdin.read(len);
  if (!body) return null;
  try { return JSON.parse(body.toString('utf8')); } catch { return null; }
}

function writeMessage(obj) {
  const json = Buffer.from(JSON.stringify(obj), 'utf8');
  const header = Buffer.alloc(4); header.writeUInt32LE(json.length,0);
  process.stdout.write(header); process.stdout.write(json);
}

function loop() {
  let msg; while ((msg = readMessage()) !== null) {
    if (msg.command) {
      if (!ALLOWED.has(msg.command)) {
        writeMessage({ ok:false, error:'command_not_allowed', command:msg.command });
        continue;
      }
      try {
        const child = spawn(msg.command, Array.isArray(msg.args)?msg.args:[], { detached:false, stdio:'ignore' });
        child.on('error', (e)=> writeMessage({ ok:false, error:e.message }));
        child.unref();
        writeMessage({ ok:true, launched:msg.command });
      } catch (e) {
        writeMessage({ ok:false, error:e.message });
      }
    } else {
      writeMessage({ ok:false, error:'no_command' });
    }
  }
}

process.stdin.on('readable', loop);
process.stdin.on('end', () => process.exit(0));
