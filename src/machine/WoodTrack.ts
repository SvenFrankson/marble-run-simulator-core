/// <reference path="Track.ts"/>

namespace MarbleRunSimulatorCore {
    export class WoodTrack extends Track {
        public mesh: BABYLON.Mesh;
        public tubeRadius: number = 0.01;
        public radiusToRaise(r: number): number {
            return r - 0.003;
        }
        public tubePath: BABYLON.Vector3[] = [];

        public get preferedStartBank(): number {
            return 0;
        }

        public get preferedEndBank(): number {
            return 0;
        }

        public AABBMin: BABYLON.Vector3 = BABYLON.Vector3.Zero();
        public AABBMax: BABYLON.Vector3 = BABYLON.Vector3.Zero();

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
                let otherS = this.part.machine.getBankAt(this.startWorldPosition, this.part);
                if (otherS) {
                    this.part.addNeighbour(otherS.part);
                    startBank = 0;
                }
            }

            let endBank = this.preferedEndBank;
            if (!forceDisconnexion) {
                let otherE = this.part.machine.getBankAt(this.endWorldPosition, this.part);
                if (otherE) {
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
            Mummu.DecimatePathInPlace(this.wires[0].path, (2 / 180) * Math.PI);
            Mummu.DecimatePathInPlace(this.wires[1].path, (2 / 180) * Math.PI);

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
            let points = [...this.templateInterpolatedPoints].map((p) => {
                return p.clone();
            });
            let normals = [...this.trackInterpolatedNormals].map((p) => {
                return p.clone();
            });

            this.tubePath = points.map((pt, i) => {
                return pt.add(normals[i].scale(this.radiusToRaise(this.tubeRadius)));
            });

            for (let i = 0; i < this.tubePath.length; i++) {
                BABYLON.Vector3.TransformCoordinatesToRef(this.tubePath[i], this.part.getWorldMatrix(), this.tubePath[i]);
            }
        }
    }
}
