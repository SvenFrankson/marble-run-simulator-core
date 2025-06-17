namespace MarbleRunSimulatorCore {
    export class Elevator extends MachinePart {

        public boxesCount: number = 4;
        public rWheel: number = 0.015;
        public boxX: number[] = [];
        public boxes: BABYLON.Mesh[] = [];
        public wheels: BABYLON.Mesh[] = [];
        public cable: BABYLON.Mesh;

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            this.setTemplate(this.machine.templateManager.getTemplate(Elevator.PropToPartName(prop)));

            for (let i = this.colors.length; i < 4; i++) {
                this.colors[i] = 0;
            }

            let x = 1;

            this.wheels = [new BABYLON.Mesh("wheel-0"), new BABYLON.Mesh("wheel-1")];
            this.wheels[0].position.copyFromFloats(0.03 * x + tileWidth * 0.5, tileHeight * (this.h + 1) - tileHeight * (this.h + 0.35), 0);
            this.wheels[0].parent = this;

            this.wheels[1].position.copyFromFloats(0.03 * x + tileWidth * 0.5, tileHeight * this.h + 0.035, 0);
            this.wheels[1].parent = this;

            this.wires = [];
            this.length = Math.abs(this.wheels[1].position.y - this.wheels[0].position.y);
            this.p = 2 * Math.PI * this.rWheel;
            this.chainLength = 2 * this.length + this.p;

            this.boxesCount = Math.round(this.chainLength / 0.08);

            for (let i = 0; i < this.boxesCount; i++) {
                let box = new BABYLON.Mesh("box");
                box.rotationQuaternion = BABYLON.Quaternion.Identity();
                box.parent = this;

                let rRamp = this.wireGauge * 0.35;
                let nRamp = 12;

                let rampWire0 = new Wire(this);
                rampWire0.colorIndex = 2;
                rampWire0.path = [new BABYLON.Vector3(-0.02 * x, 0.0015, rRamp)];
                for (let i = 0; i <= nRamp * 0.5; i++) {
                    let a = (i / nRamp) * Math.PI;
                    let cosa = Math.cos(a);
                    let sina = Math.sin(a);
                    rampWire0.path.push(new BABYLON.Vector3((sina * rRamp - rRamp - 0.0005) * x, 0, cosa * rRamp));
                }
                rampWire0.parent = box;

                let rampWire1 = new Wire(this);
                rampWire1.colorIndex = 2;
                rampWire1.path = [];
                for (let i = nRamp * 0.5; i <= nRamp; i++) {
                    let a = (i / nRamp) * Math.PI;
                    let cosa = Math.cos(a);
                    let sina = Math.sin(a);
                    rampWire1.path.push(new BABYLON.Vector3((sina * rRamp - rRamp - 0.0005) * x, 0, cosa * rRamp));
                }
                rampWire1.path.push(new BABYLON.Vector3(-0.02 * x, 0.0015, -rRamp));
                rampWire1.parent = box;

                this.boxes.push(box);
                this.wires.push(rampWire0, rampWire1);
            }

            let rCable = 0.00075;
            let cablePerimeter = 2 * Math.PI * rCable;
            let nCable = 8;
            let cableShape: BABYLON.Vector3[] = [];
            for (let i = 0; i < nCable; i++) {
                let a = (i / nCable) * 2 * Math.PI;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                cableShape[i] = new BABYLON.Vector3(cosa * rCable, sina * rCable, 0);
            }
            let x0 = this.wheels[0].position.x;
            let y0 = this.wheels[0].position.y;
            let pathCable: BABYLON.Vector3[] = [];
            for (let i = 0; i <= 16; i++) {
                let a = (i / 16) * Math.PI;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                pathCable.push(new BABYLON.Vector3(x0 + cosa * this.rWheel, y0 - sina * this.rWheel));
            }
            x0 = this.wheels[1].position.x;
            y0 = this.wheels[1].position.y;
            for (let i = 0; i < 16; i++) {
                let a = (i / 16) * Math.PI;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                pathCable.push(new BABYLON.Vector3(x0 - cosa * this.rWheel, y0 + sina * this.rWheel));
            }
            this.cable = new BABYLON.Mesh("cable");
            //this.cable = BABYLON.ExtrudeShape("wire", { shape: cableShape, path: pathCable, closeShape: true, closePath: true, updatable: true });
            //let data = BABYLON.VertexData.ExtractFromMesh(this.cable);
            //this.baseCableUVs = [...data.uvs];
            //for (let i = 0; i < this.baseCableUVs.length / 2; i++) {
            //    this.baseCableUVs[2 * i + 1] *= this.chainLength / cablePerimeter;
            //}
            //data.uvs = this.baseCableUVs;
            //data.applyToMesh(this.cable);
            let data2 = Mummu.CreateWireVertexData({ path: pathCable, radius: 0.00075, color: new BABYLON.Color4(1, 1, 1, 1), closed: true, textureRatio: 4 });
            this.baseCableUVs = [...data2.uvs];
            data2.applyToMesh(this.cable, true);
            this.cable.parent = this;

            this.generateWires();

            this.machine.onStopCallbacks.remove(this.reset);
            this.machine.onStopCallbacks.push(this.reset);
            this.reset();
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            let partName = "elevator_" + prop.h.toFixed(0);
            return partName
        }

        protected async instantiateMachineSpecific(): Promise<void> {
            this.cable.material = this.game.materials.cableMaterial;

            let wheelData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/wheel.babylon", 0);
            wheelData.applyToMesh(this.wheels[0]);
            wheelData.applyToMesh(this.wheels[1]);
            this.wheels[0].material = this.game.materials.getMaterial(this.getColor(3), this.machine.materialQ);
            this.wheels[1].material = this.game.materials.getMaterial(this.getColor(3), this.machine.materialQ);
        }

        public static GenerateTemplate(h: number) {
            let template = new MachinePartTemplate();

            template.partName = "elevator_" + h.toFixed(0);
            template.l = 2;
            template.h = h;

            template.minH = 3;
            template.hExtendableOnY = true;

            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();

            let dirLeft = new BABYLON.Vector3(1, 0, 0);
            dirLeft.normalize();
            let nLeft = new BABYLON.Vector3(0, 1, 0);
            nLeft.normalize();

            let dirRight = new BABYLON.Vector3(1, 1, 0);
            dirRight.normalize();
            let nRight = new BABYLON.Vector3(-1, 1, 0);
            nRight.normalize();

            let cupR = 0.008;
            let dH = 0.002;
            let vertX: number = tileWidth * 0.5 + 0.01 - cupR;

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].colorIndex = 0;
            template.trackTemplates[0].trackpoints = [
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5, tileHeight, 0), dir),

                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(vertX - 1.6 * cupR, tileHeight - dH, 0), dir),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(vertX - 0, tileHeight - dH - cupR * 0.6, 0), dir),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(vertX + cupR, tileHeight - dH, 0), n),

                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(vertX + cupR, tileHeight * h, 0), n),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(vertX + cupR - 0.015, tileHeight * h + 0.035, 0), new BABYLON.Vector3(-1, 1, 0).normalize(), new BABYLON.Vector3(-1, -1, 0).normalize()),
            ];
            template.trackTemplates[0].drawEndTip = true;

            template.trackTemplates[1] = new TrackTemplate(template);
            template.trackTemplates[1].colorIndex = 1;
            template.trackTemplates[1].trackpoints = [
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(-tileWidth * 0.5, tileHeight * h, 0), dirLeft),
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(-0.008 + tileWidth * 0.5, tileHeight * h + tileHeight * 0.5, 0), dirRight)
            ];

            template.maxAngle = Math.PI / 8;
            template.initialize();

            return template;
        }

        public dispose(): void {
            super.dispose();
            this.machine.onStopCallbacks.remove(this.reset);
        }

        public reset = () => {
            for (let i = 0; i < this.boxesCount; i++) {
                this.x = 0;
                this.update(0);
            }
        };

        public baseCableUVs: number[];
        public x: number = 0;
        public length: number = 0;
        public p: number = 0;
        public chainLength: number = 0;
        public speed: number = 0.04; // in m/s

        public update(dt: number): void {
            super.update(dt);
            let dx = this.speed * dt * this.game.currentTimeFactor;
            let x = 1;
            if (this.mirrorX) {
                x = -1;
            }

            this.x += dx;
            while (this.x > this.chainLength) {
                this.x -= this.chainLength;
            }

            let rCable = 0.00075;
            let cablePerimeter = 2 * Math.PI * rCable;
            let newCablesUvs = [...this.baseCableUVs];
            for (let i = 0; i < newCablesUvs.length / 2; i++) {
                newCablesUvs[2 * i + 1] -= (this.x / cablePerimeter) / 4;
            }
            this.cable.setVerticesData(BABYLON.VertexBuffer.UVKind, newCablesUvs);

            for (let i = 0; i < this.boxesCount; i++) {
                this.boxX[i] = this.x + (i / this.boxesCount) * this.chainLength;
                while (this.boxX[i] > this.chainLength) {
                    this.boxX[i] -= this.chainLength;
                }

                if (this.boxX[i] < this.length) {
                    this.boxes[i].position.x = this.wheels[0].position.x - this.rWheel * x;
                    this.boxes[i].position.y = this.wheels[0].position.y + this.boxX[i];
                    Mummu.QuaternionFromXZAxisToRef(BABYLON.Axis.X, BABYLON.Axis.Z, this.boxes[i].rotationQuaternion);
                } else if (this.boxX[i] < this.length + 0.5 * this.p) {
                    let a = ((this.boxX[i] - this.length) / (0.5 * this.p)) * Math.PI;
                    this.boxes[i].position.x = this.wheels[1].position.x - Math.cos(a) * this.rWheel * x;
                    this.boxes[i].position.y = this.wheels[1].position.y + Math.sin(a) * this.rWheel;
                    let right = this.wheels[1].position.subtract(this.boxes[i].position).normalize();
                    Mummu.QuaternionFromXZAxisToRef(right.scale(x), BABYLON.Axis.Z, this.boxes[i].rotationQuaternion);
                } else if (this.boxX[i] < 2 * this.length + 0.5 * this.p) {
                    this.boxes[i].position.x = this.wheels[0].position.x + this.rWheel * x;
                    this.boxes[i].position.y = this.wheels[1].position.y - (this.boxX[i] - (this.length + 0.5 * this.p));
                    Mummu.QuaternionFromXZAxisToRef(BABYLON.Axis.X.scale(-1), BABYLON.Axis.Z, this.boxes[i].rotationQuaternion);
                } else {
                    let a = ((this.boxX[i] - (2 * this.length + 0.5 * this.p)) / (0.5 * this.p)) * Math.PI;
                    this.boxes[i].position.x = this.wheels[0].position.x + Math.cos(a) * this.rWheel * x;
                    this.boxes[i].position.y = this.wheels[0].position.y - Math.sin(a) * this.rWheel;
                    let right = this.wheels[0].position.subtract(this.boxes[i].position).normalize();
                    Mummu.QuaternionFromXZAxisToRef(right.scale(x), BABYLON.Axis.Z, this.boxes[i].rotationQuaternion);
                }
                this.boxes[i].freezeWorldMatrix();
                this.boxes[i].getChildMeshes().forEach((child) => {
                    child.freezeWorldMatrix();
                });
                this.wires[2 * i].recomputeAbsolutePath();
                this.wires[2 * i + 1].recomputeAbsolutePath();
            }

            let deltaAngle = (dx / this.p) * 2 * Math.PI * x;
            this.wheels[0].rotation.z -= deltaAngle;
            this.wheels[0].freezeWorldMatrix();
            this.wheels[1].rotation.z -= deltaAngle;
            this.wheels[1].freezeWorldMatrix();
        }
    }
}
