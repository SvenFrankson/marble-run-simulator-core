/// <reference path="Track.ts"/>

namespace MarbleRunSimulatorCore {
    export class WoodTrack extends Track {
        public static Y0 = - 0.002;
        public mesh: BABYLON.Mesh;

        public absolutePath: BABYLON.Vector3[] = [];
        public absoluteNormals: BABYLON.Vector3[] = [];

        public get preferedStartBank(): number {
            return 0;
        }

        public get preferedEndBank(): number {
            return 0;
        }

        public AABBMin: BABYLON.Vector3 = BABYLON.Vector3.Zero();
        public AABBMax: BABYLON.Vector3 = BABYLON.Vector3.Zero();

        public shape: BABYLON.Vector3[] = [];

        public get trackWidth(): number {
            return (2.5 + 2 * this.part.s) * tileSize;
        }

        public inTrack: Track | null = null;
        public outTrack: Track | null = null;

        public inBlockZP: BABYLON.Mesh | null = null;
        public inBlockZM: BABYLON.Mesh | null = null;
        public outBlockZP: BABYLON.Mesh | null = null;
        public outBlockZM: BABYLON.Mesh | null = null;
        public obstacles: BABYLON.Mesh[] = [];

        constructor(part: MachinePart) {
            super(part);
            this.wires = [new Wire(this.part), new Wire(this.part)];
        }

        public get trackIndex(): number {
            return this.part.tracks.indexOf(this);
        }

        public getSlopeAt(index: number): number {
            let trackpoint = this.template.trackpoints[index];
            let nextTrackPoint = this.template.trackpoints[index + 1];
            if (trackpoint) {
                if (nextTrackPoint) {
                    let dy = nextTrackPoint.position.y - trackpoint.position.y;
                    let dLength = nextTrackPoint.summedLength - trackpoint.summedLength;
                    return (dy / dLength) * 100;
                } else {
                    let angleToVertical = Mummu.Angle(BABYLON.Axis.Y, trackpoint.dir);
                    let angleToHorizontal = Math.PI / 2 - angleToVertical;
                    return Math.tan(angleToHorizontal) * 100;
                }
            }
            return 0;
        }

        public getBankAt(index: number): number {
            return 0;
        }

        public initialize(template: TrackTemplate): void {
            this.template = template;

            this.trackInterpolatedNormals = template.interpolatedNormals.map((v) => {
                return v.clone();
            });

            // Update AABB values.
            let N = this.templateInterpolatedPoints.length;
            this.AABBMin.copyFromFloats(Infinity, Infinity, Infinity);
            this.AABBMax.copyFromFloats(-Infinity, -Infinity, -Infinity);
            for (let i = 0; i < N; i++) {
                let p = this.templateInterpolatedPoints[i];
                this.AABBMin.minimizeInPlace(p);
                this.AABBMax.maximizeInPlace(p);
            }
            this.AABBMin.x -= (this.part.wireSize + this.part.wireGauge) * 0.5;
            this.AABBMin.y -= (this.part.wireSize + this.part.wireGauge) * 0.5;
            this.AABBMin.z -= (this.part.wireSize + this.part.wireGauge) * 0.5;
            this.AABBMax.x += (this.part.wireSize + this.part.wireGauge) * 0.5;
            this.AABBMax.y += (this.part.wireSize + this.part.wireGauge) * 0.5;
            this.AABBMax.z += (this.part.wireSize + this.part.wireGauge) * 0.5;
            BABYLON.Vector3.TransformCoordinatesToRef(this.AABBMin, this.part.getWorldMatrix(), this.AABBMin);
            BABYLON.Vector3.TransformCoordinatesToRef(this.AABBMax, this.part.getWorldMatrix(), this.AABBMax);
        }

        public recomputeWiresPath(forceDisconnexion?: boolean): void {
            let N = this.templateInterpolatedPoints.length;

            let angles = [...this.template.angles];
            angles = angles.map(a => { return 0; });

            let startBank = this.preferedStartBank;
            if (!forceDisconnexion) {
                this.inTrack = null;
                let otherS = this.part.machine.getBankAt(this.startWorldPosition, this.part);
                if (otherS) {
                    this.inTrack = otherS.track;
                    this.part.addNeighbour(otherS.part);
                    startBank = 0;
                }
            }

            let endBank = this.preferedEndBank;
            if (!forceDisconnexion) {
                this.outTrack = null;
                let otherE = this.part.machine.getBankAt(this.endWorldPosition, this.part);
                if (otherE) {
                    this.outTrack = otherE.track;
                    this.part.addNeighbour(otherE.part);
                    endBank = 0;
                }
            }

            for (let i = 0; i < N; i++) {
                let prevPoint = this.templateInterpolatedPoints[i - 1];
                let point = this.templateInterpolatedPoints[i];
                let nextPoint = this.templateInterpolatedPoints[i + 1];
                let dir: BABYLON.Vector3;
                if (nextPoint) {
                    dir = nextPoint;
                } else {
                    dir = point;
                }
                if (prevPoint) {
                    dir = dir.subtract(prevPoint);
                } else {
                    dir = dir.subtract(point);
                }

                let tmp = BABYLON.Vector3.Cross(this.trackInterpolatedNormals[i], dir);
                BABYLON.Vector3.CrossToRef(dir, tmp, this.trackInterpolatedNormals[i]);
                this.trackInterpolatedNormals[i].normalize();

                Mummu.RotateInPlace(this.trackInterpolatedNormals[i], dir, angles[i]);
            }

            // Compute wire path
            for (let i = 0; i < N; i++) {
                let pPrev = this.templateInterpolatedPoints[i - 1] ? this.templateInterpolatedPoints[i - 1] : undefined;
                let p = this.templateInterpolatedPoints[i];
                let pNext = this.templateInterpolatedPoints[i + 1] ? this.templateInterpolatedPoints[i + 1] : undefined;

                if (!pPrev) {
                    pPrev = p.subtract(pNext.subtract(p));
                }
                if (!pNext) {
                    pNext = p.add(p.subtract(pPrev));
                }

                let dir = pNext.subtract(pPrev).normalize();
                let up = this.trackInterpolatedNormals[i];

                let rotation = BABYLON.Quaternion.Identity();
                Mummu.QuaternionFromZYAxisToRef(dir, up, rotation);

                let matrix = BABYLON.Matrix.Compose(BABYLON.Vector3.One(), rotation, p);

                this.wires[0].path[i] = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(-this.part.wireGauge * 0.5, 0, 0), matrix);
                this.wires[1].path[i] = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(this.part.wireGauge * 0.5, 0, 0), matrix);
            }
            Mummu.DecimatePathInPlaceFast(this.wires[0].path, (2 / 180) * Math.PI);
            Mummu.DecimatePathInPlaceFast(this.wires[1].path, (2 / 180) * Math.PI);

            if (this.template.drawStartTip) {
                this.wires[0].startTipCenter = this.template.trackpoints[0].position.clone();
                this.wires[0].startTipNormal = this.template.trackpoints[0].normal.clone();
                this.wires[0].startTipDir = this.template.trackpoints[0].dir.clone();
            }
            if (this.template.drawEndTip) {
                this.wires[0].endTipCenter = this.template.trackpoints[this.template.trackpoints.length - 1].position.clone();
                this.wires[0].endTipNormal = this.template.trackpoints[this.template.trackpoints.length - 1].normal.clone();
                this.wires[0].endTipDir = this.template.trackpoints[this.template.trackpoints.length - 1].dir.clone();
            }
        }

        public recomputeAbsolutePath(): void {
            this.absolutePath = [...this.templateInterpolatedPoints].map((p) => {
                return p.clone();
            });
            this.absoluteNormals = [...this.trackInterpolatedNormals].map((p) => {
                return p.clone();
            });

            for (let i = 0; i < this.absolutePath.length; i++) {
                BABYLON.Vector3.TransformCoordinatesToRef(this.absolutePath[i], this.part.getWorldMatrix(), this.absolutePath[i]);
                BABYLON.Vector3.TransformNormalToRef(this.absoluteNormals[i], this.part.getWorldMatrix(), this.absoluteNormals[i]);
            }

            let exitThickness = 0.015;
            this.part.colliders = [];
            if (this.inTrack && (this.inTrack instanceof WoodTrack && this.inTrack.trackWidth < this.trackWidth || !(this.inTrack instanceof WoodTrack) && this.part.n > 0)) {
                if (this.inBlockZP) {
                    this.inBlockZP.dispose();
                }
                if (this.inBlockZM) {
                    this.inBlockZM.dispose();
                }
                let W = this.trackWidth - 0.005;
                let w = W - 0.01;
                let inW = tileSize * 1.3;
                if (this.inTrack instanceof WoodTrack) {
                    inW = this.inTrack.trackWidth - 0.005;
                }
                let inw = inW - 0.01;
                let blockVertexData = Mummu.CreateBeveledBoxVertexData(
                    {
                        width: 0.005,
                        height: 0.015,
                        depth: 0.5 * (w - inw),
                    }
                )
                for (let i = 0; i < blockVertexData.positions.length; i += 3) {
                    let x = blockVertexData.positions[i];
                    let z = blockVertexData.positions[i + 2];
                    if (x > 0 && z > 0) {
                        blockVertexData.positions[i] += exitThickness;
                    }
                    if (z < 0) {
                        blockVertexData.positions[i + 2] += 0.001;
                    }
                }
                this.inBlockZP = new BABYLON.Mesh("inBlockZP", this.part.game.scene);
                blockVertexData.applyToMesh(this.inBlockZP);
                let xAxis = this.templateInterpolatedPoints[1].subtract(this.templateInterpolatedPoints[0]).normalize();
                xAxis.x = Math.round(xAxis.x);
                xAxis.y = Math.round(xAxis.y);
                xAxis.z = Math.round(xAxis.z);
                let zAxis = BABYLON.Vector3.Cross(xAxis, BABYLON.Axis.Y).normalize();
                this.inBlockZP.rotationQuaternion = Mummu.QuaternionFromXYAxis(xAxis, BABYLON.Axis.Y);
                
                this.inBlockZP.position.copyFrom(this.templateInterpolatedPoints[0]);
                this.inBlockZP.position.addInPlace(zAxis.scale(0.25 * (w + inw)));
                this.inBlockZP.position.addInPlace(xAxis.scale(0.005 * 0.5));
                this.inBlockZP.position.y += WoodTrack.Y0 + 0.015 * 0.5;
                this.inBlockZP.parent = this.part;
                this.inBlockZP.computeWorldMatrix(true);
                
                this.inBlockZP.material = this.part.game.materials.getMaterial(this.part.getColor(0), this.part.machine.materialQ);

                this.inBlockZM = new BABYLON.Mesh("inBlockZM", this.part.game.scene);
                this.inBlockZM.position.copyFrom(this.inBlockZP.position);
                this.inBlockZM.rotationQuaternion = this.inBlockZP.rotationQuaternion;
                Mummu.MirrorZVertexDataInPlace(blockVertexData).applyToMesh(this.inBlockZM);
                this.inBlockZM.position.addInPlace(zAxis.scale(- 0.5 * (w + inw)));
                this.inBlockZM.parent = this.part;
                this.inBlockZM.computeWorldMatrix(true);

                this.inBlockZM.material = this.inBlockZP.material;

                let bodyColliderZP = new Mummu.MeshCollider(this.inBlockZP);
                let bodyMachineColliderZP = new MachineCollider(bodyColliderZP);

                let bodyColliderZM = new Mummu.MeshCollider(this.inBlockZM);
                let bodyMachineColliderZM = new MachineCollider(bodyColliderZM);

                this.part.colliders.push(bodyMachineColliderZP, bodyMachineColliderZM);
            }
            else {
                if (this.inBlockZP) {
                    this.inBlockZP.dispose();
                }
                if (this.inBlockZM) {
                    this.inBlockZM.dispose();
                }
            }

            if (this.outTrack && (this.outTrack instanceof WoodTrack && this.outTrack.trackWidth < this.trackWidth || !(this.outTrack instanceof WoodTrack) && this.part.n > 0)) {
                if (this.outBlockZP) {
                    this.outBlockZP.dispose();
                }
                if (this.outBlockZM) {
                    this.outBlockZM.dispose();
                }
                let W = this.trackWidth - 0.005;
                let w = W - 0.01;
                let outW = tileSize * 1.3;
                if (this.outTrack instanceof WoodTrack) {
                    outW = this.outTrack.trackWidth - 0.005;
                }
                let outw = outW - 0.01;
                let blockVertexData = Mummu.CreateBeveledBoxVertexData(
                    {
                        width: 0.005,
                        height: 0.015,
                        depth: 0.5 * (w - outw),
                    }
                )
                for (let i = 0; i < blockVertexData.positions.length; i += 3) {
                    let x = blockVertexData.positions[i];
                    let z = blockVertexData.positions[i + 2];
                    if (x < 0 && z > 0) {
                        blockVertexData.positions[i] -= exitThickness;
                    }
                    if (z < 0) {
                        blockVertexData.positions[i + 2] += 0.001;
                    }
                }
                this.outBlockZP = new BABYLON.Mesh("outBlockZP", this.part.game.scene);
                blockVertexData.applyToMesh(this.outBlockZP);
                let xAxis = this.templateInterpolatedPoints[this.templateInterpolatedPoints.length - 1].subtract(this.templateInterpolatedPoints[this.templateInterpolatedPoints.length - 2]).normalize();
                xAxis.x = Math.round(xAxis.x);
                xAxis.y = Math.round(xAxis.y);
                xAxis.z = Math.round(xAxis.z);
                let zAxis = BABYLON.Vector3.Cross(xAxis, BABYLON.Axis.Y).normalize();
                this.outBlockZP.rotationQuaternion = Mummu.QuaternionFromXYAxis(xAxis, BABYLON.Axis.Y);
                
                this.outBlockZP.position.copyFrom(this.templateInterpolatedPoints[this.templateInterpolatedPoints.length - 1]);
                this.outBlockZP.position.addInPlace(zAxis.scale(0.25 * (w + outw)));
                this.outBlockZP.position.addInPlace(xAxis.scale(- 0.005 * 0.5));
                this.outBlockZP.position.y += WoodTrack.Y0 + 0.015 * 0.5;
                this.outBlockZP.parent = this.part;
                this.outBlockZP.computeWorldMatrix(true);
                
                this.outBlockZP.material = this.part.game.materials.getMaterial(this.part.getColor(0), this.part.machine.materialQ);

                this.outBlockZM = new BABYLON.Mesh("outBlockZM", this.part.game.scene);
                this.outBlockZM.position.copyFrom(this.outBlockZP.position);
                this.outBlockZM.rotationQuaternion = this.outBlockZP.rotationQuaternion;
                Mummu.MirrorZVertexDataInPlace(blockVertexData).applyToMesh(this.outBlockZM);
                this.outBlockZM.position.addInPlace(zAxis.scale(- 0.5 * (w + outw)));
                this.outBlockZM.parent = this.part;
                this.outBlockZM.computeWorldMatrix(true);

                this.outBlockZM.material = this.outBlockZP.material;

                let bodyColliderZP = new Mummu.MeshCollider(this.outBlockZP);
                let bodyMachineColliderZP = new MachineCollider(bodyColliderZP);

                let bodyColliderZM = new Mummu.MeshCollider(this.outBlockZM);
                let bodyMachineColliderZM = new MachineCollider(bodyColliderZM);

                this.part.colliders.push(bodyMachineColliderZP, bodyMachineColliderZM);
            }
            else {
                if (this.outBlockZP) {
                    this.outBlockZP.dispose();
                }
                if (this.outBlockZM) {
                    this.outBlockZM.dispose();
                }
            }

            while (this.obstacles.length > 0) {
                let o = this.obstacles.pop();
                if (o) {
                    o.dispose();
                }
            }
            if (this.part.s > 0) {
                let l = Mummu.GetPathLength(this.templateInterpolatedPoints);
                let nObstacles = Math.floor(l / 0.06) - 1;
                for (let i = 0; i < nObstacles; i++) {
                    let obstacle = BABYLON.MeshBuilder.CreateBox("obstacle", { width: 0.005, height: 0.016, depth: 0.005 }, this.part.game.scene);
                    let zAxis = Mummu.EvaluatePathTangent((i + 1) / (nObstacles + 1), this.templateInterpolatedPoints);
                    let yAxis = Mummu.EvaluatePath((i + 1) / (nObstacles + 1), this.trackInterpolatedNormals).normalize();
                    obstacle.position = Mummu.EvaluatePath((i + 1) / (nObstacles + 1), this.templateInterpolatedPoints);
                    obstacle.position.addInPlace(yAxis.scale(WoodTrack.Y0 + 0.008));
                    obstacle.rotationQuaternion = Mummu.QuaternionFromYZAxis(yAxis, zAxis);
                    obstacle.rotate(BABYLON.Axis.Y, Math.PI / 4, BABYLON.Space.LOCAL);
                    
                    obstacle.parent = this.part;
                    this.obstacles.push(obstacle);

                    
                    let collider = new Mummu.BoxCollider(obstacle.getWorldMatrix());
                    collider.width = 0.005;
                    collider.height = 0.016;
                    collider.depth = 0.005;
                    let machineCollider = new MachineCollider(collider);
                    machineCollider.randomness = 0.5;

                    this.part.colliders.push( machineCollider);
                }
            }

            /*
            let normalLines = [];
            for (let i = 0; i < this.absolutePath.length; i++) {
                let p = this.absolutePath[i];
                let n = this.absoluteNormals[i];
                normalLines.push([p, p.add(n.scale(0.05))]);
            }
            BABYLON.MeshBuilder.CreateLineSystem("normals", { lines: normalLines }).setParent(this.part);
            */
        }
    }
}
