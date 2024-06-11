namespace MarbleRunSimulatorCore {

    export class MachineDecorSelector extends BABYLON.Mesh {

        constructor(public machineDecor: MachineDecor, name: string) {
            super(name)
        }
    }

    export abstract class MachineDecor extends BABYLON.Mesh {
        
        public isPlaced: boolean = true

        protected _n: number = 0;
        public get n(): number {
            return this._n;
        }
        public setN(v: number): void {
            this._n = v;
            this.onNSet(this._n);
        }
        public onNSet(n: number): void {}

        protected _flip: boolean = false;
        public get flip(): boolean {
            return this._flip;
        }
        public setFlip(v: boolean): void {
            if (this._flip != v) {
                this._flip = v;
                if (this.rotationQuaternion) {
                    let forward = this.forward.scale(-1);
                    let up = this.up;
                    this.setDirAndUp(forward, up);
                }
            }
        }

        public selectorMesh: MachineDecorSelector;

        public setPosition(p: BABYLON.Vector3): void {
            this.position.x = Math.round(p.x * 1000) / 1000;
            this.position.y = Math.round(p.y * 1000) / 1000;
            this.position.z = Math.round(p.z * 1000) / 1000;
            
            this.freezeWorldMatrix();
            this.getChildMeshes().forEach((m) => {
                m.freezeWorldMatrix();
            });

            this.findMachinePart();
        }

        public setDirAndUp(dir: BABYLON.Vector3, up: BABYLON.Vector3): void {
            if (!this.rotationQuaternion) {
                this.rotationQuaternion = BABYLON.Quaternion.Identity();
            }
            Mummu.QuaternionFromYZAxisToRef(up, dir, this.rotationQuaternion);
            
            this.freezeWorldMatrix();
            this.getChildMeshes().forEach((m) => {
                m.freezeWorldMatrix();
            });
        }

        public machinePart: MachinePart;
        public attachMachinePart(machinePart: MachinePart): void {
            if (machinePart != this.machinePart) {
                if (this.machinePart) {
                    this.detachMachinePart();
                }
                this.machinePart = machinePart;
                if (machinePart) {
                    if (machinePart.decors.indexOf(this) === -1) {
                        machinePart.decors.push(this);
                    }
                }
            }
        }
        public detachMachinePart(): void {
            if (this.machinePart) {
                let machinePart = this.machinePart;
                this.machinePart = undefined;
                let index = machinePart.decors.indexOf(this);
                if (index != -1) {
                    machinePart.decors.splice(index, 1);
                }
            }
        }

        public findMachinePart(): void {
            let closest = Infinity;
            let closestMachinePart: MachinePart = undefined;
            for (let i = 0; i < this.machine.parts.length; i++) {
                let part = this.machine.parts[i];
                let p = BABYLON.Vector3.Zero();
                part.getProjection(this.position, p, BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero());
                let sqrDist = BABYLON.Vector3.DistanceSquared(this.position, p);
                if (sqrDist < closest) {
                    closest = sqrDist;
                    closestMachinePart = part;
                }
            }
            this.attachMachinePart(closestMachinePart);
        }

        constructor(public machine: Machine, public decorName: string) {
            super("decor");
        }
        
        public instantiated: boolean = false;
        public async instantiate(hotReload?: boolean): Promise<void> {
            this.instantiated = false;

            if (this.selectorMesh) {
                this.selectorMesh.dispose();
            }
            this.instantiateSelectorMesh();
            if (this.selectorMesh) {
                this.selectorMesh.visibility = 0;
                this.selectorMesh.parent = this;
                this.selectorMesh.freezeWorldMatrix();
            }

            await this.instantiateMachineDecorSpecific();

            this.findMachinePart();

            if (this.machinePart) {
                let up = BABYLON.Vector3.Up();
                let dir = BABYLON.Vector3.Right();
                this.machinePart.getProjection(this.position, BABYLON.Vector3.Zero(), dir, up);
                if (this.flip) {
                    dir.scaleInPlace(-1);
                }
                this.setDirAndUp(dir, up);
            }
            this.freezeWorldMatrix();

            this.instantiated = true;
        }

        public dispose(): void {
            this.detachMachinePart();
            let index = this.machine.decors.indexOf(this);
            if (index > -1) {
                this.machine.decors.splice(index, 1);
            }
            super.dispose();
        }

        public select(): void {
            if (this.selectorMesh) {
                this.selectorMesh.visibility = 0.2;
            }
        }

        public unselect(): void {
            if (this.selectorMesh) {
                this.selectorMesh.visibility = 0;
            }
        }

        public abstract instantiateSelectorMesh(): void;
        protected async instantiateMachineDecorSpecific(): Promise<void> {}
        public onBallCollideAABB(ball: Ball): void {}
    }
}