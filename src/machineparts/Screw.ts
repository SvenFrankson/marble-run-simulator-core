namespace MarbleRunSimulatorCore {
    export class Screw extends MachinePartWithOriginDestination {
        public rotor: BABYLON.Mesh;
        public screwWire: Wire;
        public x0: number = 0;
        public x1: number = 0;
        public stepW: number = 0;
        public y0: number = 0;
        public y1: number = 0;
        public stepH: number = 0;
        public dH: number = 0.002;

        public dir: BABYLON.Vector3;

        public shieldConnector: BABYLON.Mesh;
        public shieldConnectorUp: BABYLON.Mesh;
        public wheel: BABYLON.Mesh;

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            let partName = "screw_" + prop.l.toFixed(0) + "." + prop.h.toFixed(0);
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX));

            let x = 1;
            if (prop.mirrorX) {
                x = -1;
            }

            this.x0 = -tileWidth * 0.3;
            this.x1 = tileWidth * 0.3 + (this.w - 1) * tileWidth;

            this.y0 = -tileHeight * (this.h - 2 + 0.05) - 0.005;
            this.y1 = tileHeight * 0.05 + 0.005;
            if (prop.mirrorX) {
                let yT = this.y0;
                this.y0 = this.y1;
                this.y1 = yT;
            }

            for (let i = this.colors.length; i < 5; i++) {
                this.colors[i] = 0;
            }

            let r = 0.014;
            let period = 0.022;
            let p0 = new BABYLON.Vector3(-tileWidth * 0.5, -tileHeight * this.h, 0);
            p0.x += 0.03;
            p0.y -= 0.005;
            let p1 = new BABYLON.Vector3(tileWidth * (this.w - 0.5), 0, -tileDepth * (this.d - 1));
            p1.x -= 0.03;
            p1.y += 0.005;

            if (this.mirrorX) {
                let tmpP = p0.clone();
                p0.x = p1.x;
                p1.x = tmpP.x;
            }

            this.dir = p1.subtract(p0);
            let l = this.dir.length();
            this.dir.scaleInPlace(1 / l);

            p0.subtractInPlace(this.dir.scale(0.007));
            p1.addInPlace(this.dir.scale(0.03));

            this.dir = p1.subtract(p0);
            l = this.dir.length();
            this.dir.scaleInPlace(1 / l);

            let n = Mummu.Rotate(this.dir, BABYLON.Axis.Z, this.mirrorX ? -Math.PI * 0.5 : Math.PI * 0.5);

            let shieldWireR = new Wire(this);
            shieldWireR.colorIndex = 3;
            shieldWireR.path = [p0.clone().addInPlaceFromFloats(0, 0, -0.012).addInPlace(this.dir.scale(0.04)).addInPlace(n.scale(0.01)), p0.clone().addInPlaceFromFloats(0, 0, -0.012).addInPlace(this.dir.scale(-0.02)).addInPlace(n.scale(0.01))];
            this.wires.push(shieldWireR);

            let shieldWireL = new Wire(this);
            shieldWireL.colorIndex = 3;
            shieldWireL.path = [p0.clone().addInPlaceFromFloats(0, 0, 0.012).addInPlace(this.dir.scale(0.04)).addInPlace(n.scale(0.01)), p0.clone().addInPlaceFromFloats(0, 0, 0.012).addInPlace(this.dir.scale(-0.02)).addInPlace(n.scale(0.01))];
            this.wires.push(shieldWireL);

            this.shieldConnector = new BABYLON.Mesh("shieldConnector");
            this.shieldConnector.position.copyFrom(p0).addInPlace(n.scale(0.01));
            this.shieldConnector.rotationQuaternion = Mummu.QuaternionFromYZAxis(n, this.dir);
            this.shieldConnector.parent = this;

            if (this.h / this.w > 4) {
                let shieldWireUpR = new Wire(this);
                shieldWireUpR.colorIndex = 3;
                shieldWireUpR.path = [p0.clone().addInPlaceFromFloats(0, 0, -0.0165).addInPlace(this.dir.scale(0.03)).addInPlace(n.scale(0.022)), p0.clone().addInPlaceFromFloats(0, 0, -0.0165).addInPlace(this.dir.scale(-0.033)).addInPlace(n.scale(0.022))];
                this.wires.push(shieldWireUpR);

                let shieldWireUpL = new Wire(this);
                shieldWireUpL.colorIndex = 3;
                shieldWireUpL.path = [p0.clone().addInPlaceFromFloats(0, 0, 0.0165).addInPlace(this.dir.scale(0.03)).addInPlace(n.scale(0.022)), p0.clone().addInPlaceFromFloats(0, 0, 0.0165).addInPlace(this.dir.scale(-0.03)).addInPlace(n.scale(0.022))];
                this.wires.push(shieldWireUpL);

                this.shieldConnectorUp = new BABYLON.Mesh("shieldConnectorUp");
                this.shieldConnectorUp.position.copyFrom(p0).addInPlace(this.dir.scale(-0.01)).addInPlace(n.scale(0.022));
                this.shieldConnectorUp.rotationQuaternion = Mummu.QuaternionFromYZAxis(n, this.dir);
                this.shieldConnectorUp.parent = this;
            }

            this.rotor = new BABYLON.Mesh("box");

            this.screwWire = new Wire(this);
            this.screwWire.colorIndex = 1;
            this.screwWire.wireSize = 0.003;
            this.screwWire.parent = this.rotor;

            this.screwWire.path = [];
            for (let t = 0; t <= l; t += 0.001) {
                let a = (t / period) * Math.PI * 2;
                let point = new BABYLON.Vector3(t, Math.cos(a) * r, Math.sin(a) * r);
                this.screwWire.path.push(point);
            }
            this.wires.push(this.screwWire);

            this.rotor.position.copyFrom(p0);
            this.rotor.position.addInPlace(n.scale(0.021));
            this.rotor.rotationQuaternion = Mummu.QuaternionFromXYAxis(this.dir, BABYLON.Axis.Y);
            this.rotor.parent = this;

            this.wheel = new BABYLON.Mesh("wheel");
            this.wheel.position.x = l;
            this.wheel.rotation.y = Math.PI * 0.5;
            this.wheel.parent = this.rotor;

            this.generateWires();

            this.machine.onStopCallbacks.remove(this.reset);
            this.machine.onStopCallbacks.push(this.reset);
            this.reset();
        }

        protected async instantiateMachineSpecific(): Promise<void> {
            let shieldData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/uConnector.babylon", 0);
            shieldData = Mummu.CloneVertexData(shieldData);
            Mummu.ScaleVertexDataInPlace(shieldData, 0.024);
            shieldData.applyToMesh(this.shieldConnector);
            this.shieldConnector.material = this.game.materials.getMaterial(this.getColor(4), this.machine.materialQ);
            
            if (this.shieldConnectorUp) {
                let shieldDataUp = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/uConnector.babylon", 0);
                shieldDataUp = Mummu.CloneVertexData(shieldDataUp);
                Mummu.ScaleVertexDataInPlace(shieldDataUp, 0.033);
                shieldDataUp.applyToMesh(this.shieldConnectorUp);
                this.shieldConnectorUp.material = this.game.materials.getMaterial(this.getColor(4), this.machine.materialQ);
            }

            let wheelData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/wheel.babylon", 1);
            wheelData = Mummu.CloneVertexData(wheelData);
            Mummu.ScaleVertexDataInPlace(wheelData, 1.05);
            wheelData.applyToMesh(this.wheel);
            this.wheel.material = this.game.materials.getMaterial(this.getColor(2), this.machine.materialQ);
        }

        public static GenerateTemplate(w: number, h: number, mirrorX: boolean) {
            let template = new MachinePartTemplate();

            if (isNaN(h)) {
                debugger;
            }
            template.partName = "screw_" + w.toFixed(0) + "." + h.toFixed(0);

            template.h = h;
            template.w = w;
            template.mirrorX = mirrorX;

            template.xExtendable = true;
            template.minW = 1;
            template.yExtendable = true;
            template.minH = 1;
            template.xMirrorable = true;

            let p0 = new BABYLON.Vector3(-tileWidth * 0.5, -tileHeight * template.h, 0);
            p0.x += 0.03;
            p0.y -= 0.005;
            let p1 = new BABYLON.Vector3(tileWidth * (template.w - 0.5), 0, -tileDepth * (template.d - 1));
            p1.x -= 0.03;
            p1.y += 0.005;
            let dir = p1.subtract(p0).normalize();

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5, -tileHeight * template.h, 0), Tools.V3Dir(90)),
                new TrackPoint(template.trackTemplates[0], p0, dir),
                new TrackPoint(template.trackTemplates[0], p1, dir),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * (template.w - 0.5), 0, -tileDepth * (template.d - 1)), Tools.V3Dir(90)),
            ];

            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }

            template.initialize();

            return template;
        }

        public dispose(): void {
            super.dispose();
            this.machine.onStopCallbacks.remove(this.reset);
        }

        public reset = () => {
            this.a = 0;
            this.update(0);
        };

        public l: number = 0;
        public p: number = 0;
        public speed: number = 2 * Math.PI; // in m/s
        public a: number = 0;

        public update(dt: number): void {
            super.update(dt);
            let dA = this.speed * dt * this.game.currentTimeFactor;
            let x = 1;
            if (this.mirrorX) {
                x = -1;
            }

            this.a = this.a + dA;
            while (this.a > 2 * Math.PI) {
                this.a -= 2 * Math.PI;
            }

            if (this.a === 0) {
                Mummu.QuaternionFromXYAxisToRef(this.dir, BABYLON.Axis.Y, this.rotor.rotationQuaternion);
            }
            else {
                this.rotor.rotate(BABYLON.Axis.X, - dA);
            }

            this.rotor.freezeWorldMatrix();
            this.rotor.getChildMeshes().forEach((child) => {
                child.freezeWorldMatrix();
            });
            this.screwWire.recomputeAbsolutePath();
        }

        public recreateFromOriginDestination(origin: Nabu.IJK, dest: Nabu.IJK, machine: Machine): Screw {
            if (origin.i > dest.i) {
                let tmp = origin;
                origin = dest;
                dest = tmp;
            }
            let i = Math.min(origin.i, dest.i);
            let j = Math.min(origin.j, dest.j);
            let w = Math.abs(dest.i - origin.i);
            let h = Math.abs(dest.j - origin.j);
            let mirrorX = false;
            if (origin.j < dest.j) {
                mirrorX = true;
            }
            if (!this.getIsNaNOrValidWHD(w, h)) {
                return undefined;
            }
            return new Screw(machine, {
                i: i,
                j: j,
                k: this.k,
                l: w,
                h: h,
                c: this.colors,
                mirrorX: mirrorX,
            });
        }

        public getOrigin(): Nabu.IJK {
            let i = this.i;

            let j: number;
            if (this.mirrorX) {
                j = this.j;
            } else {
                j = this.j + this.h;
            }

            let k = this.k;
            return {
                i: i,
                j: j,
                k: k,
            };
        }

        public getDestination(): Nabu.IJK {
            let i = this.i + this.w;

            let j: number;
            if (this.mirrorX) {
                j = this.j + this.h;
            } else {
                j = this.j;
            }

            let k = this.k;
            return {
                i: i,
                j: j,
                k: k,
            };
        }
    }
}
