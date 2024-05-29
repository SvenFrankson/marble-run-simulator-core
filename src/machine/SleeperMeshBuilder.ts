namespace MarbleRunSimulatorCore {
    export interface ISleeperMeshProps {
        spacing?: number;
        drawWallAnchors?: boolean;
        drawGroundAnchors?: boolean;
        groundAnchorsRelativeMaxY?: number;
        forceDrawWallAnchors?: boolean;
        forcedWallAnchorsZ?: number;
    }

    export class SleeperMeshBuilder {
        public static GenerateSleepersVertexData(part: MachinePart, props: ISleeperMeshProps): Map<number, BABYLON.VertexData> {
            if (!isFinite(props.spacing)) {
                props.spacing = 0.03;
            }
            if (!isFinite(props.groundAnchorsRelativeMaxY)) {
                props.groundAnchorsRelativeMaxY = 1;
            }

            let q = part.game.getGeometryQ();
            let partialsDatas: BABYLON.VertexData[][] = [];

            for (let j = 0; j < part.tracks.length; j++) {
                let track = part.tracks[j];
                let colorIndex = track.part.getColor(track.template.colorIndex);
                let plasticIndex: number = 6;
                let interpolatedPoints = track.templateInterpolatedPoints;
                let summedLength: number[] = [0];
                for (let i = 1; i < interpolatedPoints.length; i++) {
                    let prev = interpolatedPoints[i - 1];
                    let trackpoint = interpolatedPoints[i];
                    let dist = BABYLON.Vector3.Distance(prev, trackpoint);
                    summedLength[i] = summedLength[i - 1] + dist;
                }

                let count = Math.round(summedLength[summedLength.length - 1] / props.spacing / 3) * 3;
                count = Math.max(1, count);
                let correctedSpacing = summedLength[summedLength.length - 1] / count;

                let radiusShape = part.wireSize * 0.5 * 0.75;
                if (colorIndex >= plasticIndex) {
                    radiusShape *= 2;
                }
                let nShape = 3;
                if (q === 1) {
                    nShape = 4;
                } else if (q === 2) {
                    nShape = 6;
                }
                let shape: BABYLON.Vector3[] = [];
                for (let i = 0; i < nShape; i++) {
                    let a = (i / nShape) * 2 * Math.PI;
                    let cosa = Math.cos(a);
                    let sina = Math.sin(a);
                    shape[i] = new BABYLON.Vector3(cosa * radiusShape, sina * radiusShape, 0);
                }

                let radiusPath = part.wireGauge * 0.5;
                let nPath = 4;
                if (q === 1) {
                    nPath = 8;
                } else if (q === 2) {
                    nPath = 12;
                }
                let basePath: BABYLON.Vector3[] = [];
                for (let i = 0; i <= nPath; i++) {
                    let a = (i / nPath) * Math.PI;
                    let cosa = Math.cos(a);
                    let sina = Math.sin(a);
                    basePath[i] = new BABYLON.Vector3(cosa * radiusPath, -sina * radiusPath, 0);
                }

                let sleeperPieceVertexDataTypeIndex = colorIndex >= plasticIndex ? 3 : 0;
                if (q === 1) {
                    sleeperPieceVertexDataTypeIndex += 1;
                } else if (q === 0) {
                    sleeperPieceVertexDataTypeIndex += 2;
                }
                let sleeperPieceVertexData = part.machine.sleeperVertexData ? part.machine.sleeperVertexData[sleeperPieceVertexDataTypeIndex] : undefined;

                let quat = BABYLON.Quaternion.Identity();
                let n = 0.5;
                for (let i = 1; i < interpolatedPoints.length - 1; i++) {
                    let sumPrev = summedLength[i - 1];
                    let sum = summedLength[i];
                    let sumNext = summedLength[i + 1];
                    let targetSumLength = n * correctedSpacing;
                    let addSleeper: boolean = false;
                    if (sumPrev < targetSumLength && sum >= targetSumLength) {
                        let f = (targetSumLength - sumPrev) / (sum - sumPrev);
                        if (f > 0.5) {
                            addSleeper = true;
                        }
                    }
                    if (sum <= targetSumLength && sumNext > targetSumLength) {
                        let f = (targetSumLength - sum) / (sumNext - sum);
                        if (f <= 0.5) {
                            addSleeper = true;
                        }
                    }

                    if (track.template.cutOutSleeper && track.template.cutOutSleeper(i)) {
                        addSleeper = false;
                    }

                    let anchor: BABYLON.Vector3 = BABYLON.Vector3.Zero();
                    if (addSleeper && sleeperPieceVertexData) {
                        anchor = new BABYLON.Vector3(0, - radiusPath, 0);

                        let dir = interpolatedPoints[i + 1].subtract(interpolatedPoints[i - 1]).normalize();
                        let t = interpolatedPoints[i];
                        let up = track.trackInterpolatedNormals[i];
                        Mummu.QuaternionFromYZAxisToRef(up, dir, quat);

                        anchor.rotateByQuaternionToRef(quat, anchor);
                        anchor.addInPlace(t);

                        let tmp = Mummu.CloneVertexData(sleeperPieceVertexData);
                        Mummu.RotateVertexDataInPlace(tmp, quat);
                        Mummu.TranslateVertexDataInPlace(tmp, t);

                        if (!partialsDatas[colorIndex]) {
                            partialsDatas[colorIndex] = [];
                        }
                        partialsDatas[colorIndex].push(tmp);

                        if (track.part.isPlaced && (props.drawWallAnchors || props.forceDrawWallAnchors)) {
                            let addAnchor = false;
                            if ((part.k === 0 || props.forceDrawWallAnchors) && (n - 1.5) % 3 === 0 && up.y > 0.1) {
                                if (anchor.z > -0.01) {
                                    addAnchor = true;
                                }
                            }

                            if (addAnchor) {
                                let anchorCenter = anchor.clone();
                                anchorCenter.z = 0.015;
                                if (isFinite(props.forcedWallAnchorsZ)) {
                                    anchorCenter.z = props.forcedWallAnchorsZ;
                                }
                                let radiusFixation = Math.abs(anchor.z - anchorCenter.z);
                                let anchorWall = anchorCenter.clone();
                                anchorWall.y -= radiusFixation * 0.5;
                                let nFixation = 2;
                                if (q === 1) {
                                    nFixation = 6;
                                } else if (q === 2) {
                                    nFixation = 10;
                                }
                                let fixationPath: BABYLON.Vector3[] = [];
                                for (let i = 0; i <= nFixation; i++) {
                                    let a = (i / nFixation) * 0.5 * Math.PI;
                                    let cosa = Math.cos(a);
                                    let sina = Math.sin(a);
                                    fixationPath[i] = new BABYLON.Vector3(0, -sina * radiusFixation * 0.5, -cosa * radiusFixation);
                                    fixationPath[i].addInPlace(anchorCenter);
                                }

                                let tmp = BABYLON.ExtrudeShape("tmp", { shape: shape, path: fixationPath, closeShape: true, cap: BABYLON.Mesh.CAP_ALL });
                                let colorIndex = track.part.getColor(track.template.colorIndex);
                                if (!partialsDatas[colorIndex]) {
                                    partialsDatas[colorIndex] = [];
                                }
                                partialsDatas[colorIndex].push(BABYLON.VertexData.ExtractFromMesh(tmp));
                                tmp.dispose();

                                let tmpVertexData = BABYLON.CreateCylinderVertexData({ height: 0.001, diameter: 0.01, tessellation: 16 });
                                let quat = BABYLON.Quaternion.Identity();
                                Mummu.QuaternionFromYZAxisToRef(new BABYLON.Vector3(0, 0, 1), new BABYLON.Vector3(0, 1, 0), quat);
                                Mummu.RotateVertexDataInPlace(tmpVertexData, quat);
                                Mummu.TranslateVertexDataInPlace(tmpVertexData, anchorWall);
                                partialsDatas[colorIndex].push(tmpVertexData);
                                tmp.dispose();
                            }
                        }

                        if (track.part.isPlaced && (props.drawGroundAnchors && q > 0)) {
                            if (((n - 1.5) % 6 === 0 || count === 1) && up.y > 0.1) {
                                let anchorYWorld = anchor.y + part.position.y;
                                let anchorBase = anchor.clone();
                                let minY = part.machine.baseMeshMinY;
                                let maxY = part.machine.baseMeshMaxY;
                                anchorBase.y = part.machine.baseMeshMinY - part.position.y;

                                if (anchorYWorld < minY + props.groundAnchorsRelativeMaxY * (maxY - minY)) {
                                    let rayOrigin = anchor.add(part.position);
                                    let rayDir = new BABYLON.Vector3(0, -1, 0);
                                    rayOrigin.addInPlace(rayDir.scale(0.01));
                                    let ray = new BABYLON.Ray(rayOrigin, rayDir, 3);
                                    let pick = part.game.scene.pickWithRay(ray, (m) => {
                                        return m instanceof MachinePartSelectorMesh;
                                    });
                                    if (!pick.hit) {
                                        let fixationPath: BABYLON.Vector3[] = [anchor, anchorBase];

                                        let tmp = BABYLON.ExtrudeShape("tmp", { shape: shape, path: fixationPath, closeShape: true, cap: BABYLON.Mesh.CAP_ALL });
                                        let colorIndex = track.part.getColor(track.template.colorIndex);
                                        if (!partialsDatas[colorIndex]) {
                                            partialsDatas[colorIndex] = [];
                                        }
                                        partialsDatas[colorIndex].push(BABYLON.VertexData.ExtractFromMesh(tmp));
                                        tmp.dispose();

                                        let tmpVertexData = BABYLON.CreateCylinderVertexData({ height: 0.002, diameter: 0.012, tessellation: 8 });
                                        Mummu.TranslateVertexDataInPlace(tmpVertexData, anchorBase);
                                        partialsDatas[colorIndex].push(tmpVertexData);
                                        tmp.dispose();
                                    }
                                }
                            }
                        }
                        n++;
                    }
                }
            }

            let datas = new Map<number, BABYLON.VertexData>();
            for (let i = 0; i < partialsDatas.length; i++) {
                if (partialsDatas[i]) {
                    datas.set(i, Mummu.MergeVertexDatas(...partialsDatas[i]));
                }
            }
            return datas;
        }
    }
}
