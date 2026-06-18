/**
 * DevConsole — toggleable in-game command console (seed §5).
 *
 * A DOM overlay (easiest for typing) that parses simple commands and dispatches
 * them to whatever scene implements DevCommandHost. You will use this to test
 * yourself: teleport, spawn, give, godmode, reloadzone.
 */

export interface DevCommandHost {
  teleport(x: number, y: number): void;
  spawn(enemyId: string): void;
  spawnBoss(bossId: string): void;
  defeatBoss(spawnId: string): void;
  giveRefrain(id: string): void;
  toggleGodmode(): boolean;
  reloadZone(): void;
  listZones(): string[];
  gotoZone(id: string): void;
}

export class DevConsole {
  private root: HTMLDivElement;
  private input: HTMLInputElement;
  private log: HTMLDivElement;
  private open = false;
  private host: DevCommandHost;

  constructor(host: DevCommandHost) {
    this.host = host;
    this.root = document.createElement('div');
    this.root.style.cssText = [
      'position:fixed',
      'left:0',
      'right:0',
      'bottom:0',
      'max-height:40%',
      'background:rgba(5,8,12,0.92)',
      'color:#9ad8ff',
      'font:12px/1.4 monospace',
      'padding:6px',
      'display:none',
      'z-index:99999',
      'border-top:1px solid #294',
    ].join(';');

    this.log = document.createElement('div');
    this.log.style.cssText =
      'max-height:120px;overflow:auto;white-space:pre-wrap;margin-bottom:4px';

    this.input = document.createElement('input');
    this.input.placeholder = 'dev> help';
    this.input.style.cssText =
      'width:100%;background:#0b0f14;color:#cfeaff;border:1px solid #294;padding:4px;font:12px monospace';
    this.input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        this.run(this.input.value.trim());
        this.input.value = '';
      }
    });

    this.root.appendChild(this.log);
    this.root.appendChild(this.input);
    document.body.appendChild(this.root);
    this.print('The Last Chorus dev console. Type `help`.');
  }

  toggle(): void {
    this.open = !this.open;
    this.root.style.display = this.open ? 'block' : 'none';
    if (this.open) this.input.focus();
    else this.input.blur();
  }

  get isOpen(): boolean {
    return this.open;
  }

  private print(msg: string): void {
    this.log.textContent += `\n${msg}`;
    this.log.scrollTop = this.log.scrollHeight;
  }

  private run(line: string): void {
    if (!line) return;
    this.print(`> ${line}`);
    const [cmd, ...args] = line.split(/\s+/);
    try {
      switch (cmd) {
        case 'help':
          this.print(
            'commands: teleport <x> <y> | spawn <enemyId> | boss <bossId> | defeat <spawnId> | give <refrainId> | godmode | reloadzone | zones | goto <zoneId>',
          );
          break;
        case 'boss':
          this.host.spawnBoss(args[0]!);
          this.print(`spawned boss ${args[0]}`);
          break;
        case 'defeat':
          this.host.defeatBoss(args[0]!);
          this.print(`defeated ${args[0]}`);
          break;
        case 'teleport':
          this.host.teleport(Number(args[0]), Number(args[1]));
          this.print(`teleported to ${args[0]},${args[1]}`);
          break;
        case 'spawn':
          this.host.spawn(args[0]!);
          this.print(`spawned ${args[0]}`);
          break;
        case 'give':
          this.host.giveRefrain(args[0]!);
          this.print(`gave refrain ${args[0]}`);
          break;
        case 'godmode': {
          const on = this.host.toggleGodmode();
          this.print(`godmode ${on ? 'ON' : 'OFF'}`);
          break;
        }
        case 'reloadzone':
          this.host.reloadZone();
          this.print('zone reloaded');
          break;
        case 'zones':
          this.print(this.host.listZones().join(', '));
          break;
        case 'goto':
          this.host.gotoZone(args[0]!);
          this.print(`goto ${args[0]}`);
          break;
        default:
          this.print(`unknown command: ${cmd}`);
      }
    } catch (err) {
      this.print(`error: ${(err as Error).message}`);
    }
  }
}
