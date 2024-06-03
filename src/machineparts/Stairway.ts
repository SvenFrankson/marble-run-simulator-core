namespace MarbleRunSimulatorCore {
    export class Stairway extends MachinePart {
        public boxesCount: number = 4;
        public boxesColliders: BABYLON.Mesh[] = [];
        public boxesDisplayedMesh: BABYLON.Mesh[] = [];
        public vil: BABYLON.Mesh;
        public bielles: BABYLON.Mesh[] = [];
        public x0: number = 0;
        public x1: number = 0;
        public stepW: number = 0;
        public y0: number = 0;
        public y1: number = 0;
        public stepH: number = 0;
        public dH: number = 0.002;

        public static MakeStairwayColliderVertexData(width: number, height: number, depth: number, dH: number, radius: number = 0.001): BABYLON.VertexData {
            let path: BABYLON.Vector2[] = [new BABYLON.Vector2(-width * 0.5, -height * 0.5)];

            let left = -width * 0.5;
            let top = height * 0.5;

            for (let i = 0; i <= 6; i++) {
                let a = ((i / 6) * Math.PI) / 2;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                let v = new BABYLON.Vector2(left, top + dH);
                v.x += (1 - cosa) * radius;
                v.y -= (1 - sina) * radius;
                path.push(v);
            }

            path.push(new BABYLON.Vector2(width * 0.5, height * 0.5));

            let data = new BABYLON.VertexData();

            let positions: number[] = [];
            let indices: number[] = [];

            for (let i = 0; i < path.length; i++) {
                let p = path[i];
                let l = positions.length / 3;
                positions.push(p.x, p.y, depth * 0.5);
                positions.push(p.x, p.y, -depth * 0.5);
                if (i < path.length - 1) {
                    indices.push(l, l + 1, l + 3);
                    indices.push(l, l + 3, l + 2);
                }
            }

            data.positions = positions;
            data.indices = indices;
            let normals = [];
            BABYLON.VertexData.ComputeNormals(positions, indices, normals);
            data.normals = normals;

            return data;
        }

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            let partName = "stairway-" + prop.w.toFixed(0) + "." + prop.h.toFixed(0);
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX));

            for (let i = this.colors.length; i < 4; i++) {
                this.colors[i] = 0;
            }

            let x = 1;
            if (prop.mirrorX) {
                x = -1;
            }

            this.x0 = -tileWidth * 0.3;
            this.x1 = tileWidth * 0.3 + (this.w - 1) * tileWidth;
            this.boxesCount = Math.round((this.x1 - this.x0) / 0.02);

            this.stepW = (this.x1 - this.x0) / this.boxesCount;
            this.y0 = -tileHeight * (this.h - 2 + 0.05) - 0.005;
            this.y1 = tileHeight * 0.05 + 0.005;
            if (prop.mirrorX) {
                let yT = this.y0;
                this.y0 = this.y1;
                this.y1 = yT;
            }
            this.stepH = Math.abs((this.y1 - this.y0) / this.boxesCount);
            for (let i = 0; i < this.boxesCount; i++) {
                let data = Stairway.MakeStairwayColliderVertexData(this.stepW, this.stepH * 2, 0.02, this.dH, 0.001);

                let box = new BABYLON.Mesh("collider-" + i);
                this.boxesColliders[i] = box;
                this.boxesDisplayedMesh[i] = new BABYLON.Mesh("display-box-" + i);
                box.isVisible = false;
                data.applyToMesh(box);
                if (this.mirrorX) {
                    box.rotation.y = Math.PI;
                }
                box.parent = this;
                let fX = i / this.boxesCount;
                box.position.x = (1 - fX) * this.x0 + fX * this.x1 + this.stepW * 0.5;
                let fY = (i + 0.5) / this.boxesCount;
                box.position.y = (1 - fY) * this.y0 + fY * this.y1 - this.stepH;

                this.bielles[i] = new BABYLON.Mesh("bielle");
            }

            this.vil = new BABYLON.Mesh("display-vil");
            this.vil.position.y = -tileHeight * (this.h - 2 + 1.5);
            this.vil.parent = this;

            this.generateWires();

            this.machine.onStopCallbacks.remove(this.reset);
            this.machine.onStopCallbacks.push(this.reset);
            this.reset();
        }

        protected async instantiateMachineSpecific(): Promise<void> {
            for (let i = 0; i < this.boxesCount; i++) {
                let fY = (i + 0.5) / this.boxesCount;
                let l = ((1 - fY) * this.y0 + fY * this.y1 - this.stepH - this.dH * 0.5) - -tileHeight * (this.h - 2 + 1.5) + this.stepH - 0.002;
                let vertexData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/stairway-bielle.babylon", 0);
                vertexData = Mummu.CloneVertexData(vertexData);
                let positions = vertexData.positions;
                for (let p = 0; p < positions.length / 3; p++) {
                    let y = positions[3 * p + 1];

                    if (y > 0.005) {
                        positions[3 * p + 1] -= 0.01;
                        positions[3 * p + 1] += l;
                    }
                }
                vertexData.positions = positions;
                let normals = [];
                BABYLON.VertexData.ComputeNormals(vertexData.positions, vertexData.indices, normals);
                vertexData.normals = normals;
                vertexData.applyToMesh(this.bielles[i]);

                this.bielles[i].material = this.game.materials.getMaterial(this.getColor(2));

                let stepVertexData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/stairway-step.babylon", 0);
                stepVertexData = Mummu.CloneVertexData(stepVertexData);
                positions = stepVertexData.positions;
                for (let p = 0; p < positions.length / 3; p++) {
                    let x = positions[3 * p];
                    let y = positions[3 * p + 1];
                    let z = positions[3 * p + 2];

                    if (x < 0) {
                        positions[3 * p] += 0.005;
                        positions[3 * p] -= this.stepW * 0.5;
                    } else {
                        positions[3 * p] -= 0.005;
                        positions[3 * p] += this.stepW * 0.5;
                    }

                    if (y < 0) {
                        positions[3 * p + 1] += 0.005;
                        positions[3 * p + 1] -= this.stepH;
                    } else {
                        positions[3 * p + 1] -= 0.005;
                        positions[3 * p + 1] += this.stepH;
                    }

                    if (z < 0) {
                        positions[3 * p + 2] += 0.005;
                        positions[3 * p + 2] -= 0.01;
                    } else {
                        positions[3 * p + 2] -= 0.005;
                        positions[3 * p + 2] += 0.01;
                    }

                    if (x < 0 && y > 0) {
                        positions[3 * p + 1] += this.dH;
                    } else if (y < 0) {
                        positions[3 * p + 1] -= this.dH;
                    }

                    if (x < 0) {
                        positions[3 * p] += 0.0002;
                    } else {
                        positions[3 * p] -= 0.0002;
                    }
                }
                stepVertexData.positions = positions;
                stepVertexData.applyToMesh(this.boxesDisplayedMesh[i]);
                this.boxesDisplayedMesh[i].parent = this.boxesColliders[i];

                this.boxesDisplayedMesh[i].material = this.game.materials.getMaterial(this.getColor(1));
            }

            let vertexData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/stairway-vil.babylon", 0);
            vertexData = Mummu.CloneVertexData(vertexData);

            let positions = vertexData.positions;
            for (let p = 0; p < positions.length / 3; p++) {
                let x = positions[3 * p];
                let y = positions[3 * p + 1];
                let z = positions[3 * p + 2];

                if (x < -0.0045) {
                    positions[3 * p] += 0.005;
                    positions[3 * p] -= this.stepW * 0.5;
                } else if (x > 0.0045) {
                    positions[3 * p] -= 0.005;
                    positions[3 * p] += this.stepW * 0.5;
                }

                if (y > 0.005) {
                    positions[3 * p + 1] -= 0.01;
                    positions[3 * p + 1] += (this.stepH * 0.5 + this.dH * 0.5);
                }
            }
            vertexData.positions = positions;

            let vilPartsDatas: BABYLON.VertexData[] = [];
            let altQ = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.X, Math.PI);
            for (let i = 0; i < this.boxesCount; i++) {
                let partData = Mummu.CloneVertexData(vertexData);

                let fX = i / this.boxesCount;
                let x = (1 - fX) * this.x0 + fX * this.x1 + this.stepW * 0.5;
                if (i % 2 === 1) {
                    Mummu.RotateVertexDataInPlace(partData, altQ);
                }
                Mummu.TranslateVertexDataInPlace(partData, new BABYLON.Vector3(x, 0, 0));

                vilPartsDatas.push(partData);
            }

            let wheelData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/wheel.babylon", 1);
            let wheel0Data = Mummu.CloneVertexData(wheelData);
            //Mummu.ScaleVertexDataInPlace(wheel0Data, 0.03);
            Mummu.RotateVertexDataInPlace(wheel0Data, BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, Math.PI * 0.5));
            Mummu.TranslateVertexDataInPlace(wheel0Data, new BABYLON.Vector3(this.x0 - 0.001, 0, 0));

            let wheel1Data = Mummu.CloneVertexData(wheelData);
            //Mummu.ScaleVertexDataInPlace(wheel1Data, 0.03);
            Mummu.RotateVertexDataInPlace(wheel1Data, BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, Math.PI * 0.5));
            Mummu.TranslateVertexDataInPlace(wheel1Data, new BABYLON.Vector3(this.x1 + 0.001, 0, 0));

            Mummu.MergeVertexDatas(...vilPartsDatas, wheel0Data, wheel1Data).applyToMesh(this.vil);

            this.vil.material = this.game.materials.getMaterial(this.getColor(3));
        }

        public static GenerateTemplate(w: number, h: number, mirrorX: boolean) {
            let template = new MachinePartTemplate();

            if (isNaN(h)) {
                debugger;
            }
            template.partName = "stairway-" + w.toFixed(0) + "." + h.toFixed(0);

            template.h = h;
            template.w = w;
            template.mirrorX = mirrorX;

            template.xExtendable = true;
            template.yExtendable = true;
            template.xMirrorable = true;

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

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5, -tileHeight * (h - 2), 0), dir), new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.3, -tileHeight * (h - 2 + 0.05), 0), dir)];

            template.trackTemplates[1] = new TrackTemplate(template);
            template.trackTemplates[1].trackpoints = [
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3((template.w - 1) * tileWidth + tileWidth * 0.3, tileHeight * 0.05 - 0.02, 0), Tools.V3Dir(0), Tools.V3Dir(-90)),
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3((template.w - 1) * tileWidth + tileWidth * 0.3, tileHeight * 0.05 - 0.003, 0), Tools.V3Dir(0)),
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3((template.w - 1) * tileWidth + tileWidth * 0.3 + 0.003, tileHeight * 0.05, 0), Tools.V3Dir(90)),
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3((template.w - 1) * tileWidth + tileWidth * 0.5, 0, 0), Tools.V3Dir(90)),
            ];
            template.trackTemplates[1].drawStartTip = true;

            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }

            template.initialize();

            return template;
        }

        public dispose(): void {
            super.dispose();
            this.bielles.forEach((bielle) => {
                bielle.dispose();
            });
            this.machine.onStopCallbacks.remove(this.reset);
        }

        public reset = () => {
            for (let i = 0; i < this.boxesCount; i++) {
                this.a = Math.PI * 0.5;
                this.update(0);
            }
        };

        public l: number = 0;
        public p: number = 0;
        public speed: number = Math.PI; // in m/s
        public a: number = 0;

        public update(dt: number): void {
            let dA = this.speed * dt * this.game.currentTimeFactor;
            let x = 1;
            if (this.mirrorX) {
                x = -1;
            }

            this.a = this.a + dA;
            while (this.a > 2 * Math.PI) {
                this.a -= 2 * Math.PI;
            }
            this.vil.rotation.x = this.a;
            this.vil.freezeWorldMatrix();
            for (let i = 0; i < this.boxesColliders.length; i++) {
                let a = this.a;
                if (i % 2 === 1) {
                    a += Math.PI;
                }
                let box = this.boxesColliders[i];

                let fY = (i + 0.5) / this.boxesCount;
                box.position.y = (1 - fY) * this.y0 + fY * this.y1 - this.stepH - this.dH * 0.5;
                box.position.y += Math.cos(a) * (this.stepH * 0.5 + this.dH * 0.5);
                this.boxesColliders[i].freezeWorldMatrix();
                this.boxesColliders[i].getChildMeshes().forEach((child) => {
                    child.freezeWorldMatrix();
                });

                this.bielles[i].position.copyFrom(this.vil.absolutePosition);
                let fX = i / this.boxesCount;
                this.bielles[i].position.x += (1 - fX) * this.x0 + fX * this.x1 + this.stepW * 0.5;
                this.bielles[i].position.y += Math.cos(a) * (this.stepH * 0.5 + this.dH * 0.5);
                this.bielles[i].position.z += Math.sin(a) * (this.stepH * 0.5 + this.dH * 0.5);
                let dir = this.boxesColliders[i].absolutePosition.subtract(this.bielles[i].position).addInPlaceFromFloats(0, this.stepH - 0.002, 0);
                this.bielles[i].rotationQuaternion = Mummu.QuaternionFromYZAxis(dir, BABYLON.Axis.Z);
            }
        }
    }
}
