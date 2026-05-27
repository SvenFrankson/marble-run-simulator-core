namespace MarbleRunSimulatorCore {
    export interface IWoodTrackMeshProps {
        
    }

    export class WoodTrackMeshBuilder {

        public static async BuildWoodTrackMesh(track: WoodTrack, props: IWoodTrackMeshProps): Promise<void> {
            if (track.mesh) {
                track.mesh.dispose();
            }

            track.mesh = new BABYLON.Mesh("track-mesh");
            track.mesh.parent = track.part;
            track.mesh.material = track.part.game.materials.getMaterial(track.part.getColor(0), track.part.machine.materialQ);

            /*
            let normalLines = [];
            for (let i = 0; i < track.templateInterpolatedPoints.length; i++) {
                let p = track.templateInterpolatedPoints[i];
                let n = track.trackInterpolatedNormals[i];
                normalLines.push([p, p.add(n.scale(0.05))]);
            }
            BABYLON.MeshBuilder.CreateLineSystem("normals", { lines: normalLines }).parent = track.mesh;
            */
            
            let W = track.trackWidth - 0.005;
            let w = W - 0.01;
            let W05 = W * 0.5;
            let w05 = w * 0.5;
            let H = 0.015;
            let h = 0.01;
            let dH = H - h;
            let m = 0.001;
            let y0 = - 0.0025;

            let points = track.templateInterpolatedPoints.map((p) => {
                return p.clone();
            });
            
            Mummu.DecimatePathInPlaceFast(points, (2 / 180) * Math.PI);

            let p0 = points[0];
            let p1 = points[1];
            let dirIn = p1.subtract(p0).normalize();
            dirIn.x = Math.round(dirIn.x);
            dirIn.y = Math.round(dirIn.y);
            dirIn.z = Math.round(dirIn.z);

            let pN1 = points[points.length - 2];
            let pN = points[points.length - 1];
            let dirOut = pN.subtract(pN1).normalize();
            dirOut.x = Math.round(dirOut.x);
            dirOut.y = Math.round(dirOut.y);
            dirOut.z = Math.round(dirOut.z);

            //p0.addInPlace(dirIn.scale(0.0005));
            //pN.subtractInPlace(dirOut.scale(0.0005));

            let rightIn = BABYLON.Vector3.Cross(BABYLON.Vector3.Up(), dirIn).normalize();
            let rightOut = BABYLON.Vector3.Cross(BABYLON.Vector3.Up(), dirOut).normalize();
            let p0Left = p0.add(rightIn.scale(- W05));
            let p0Right = p0.add(rightIn.scale(W05));
            let pNLeft = pN.add(rightOut.scale(- W05));
            let pNRight = pN.add(rightOut.scale(W05));
            let dLeft = p0Left.subtract(pNLeft).multiplyByFloats(1, 0, 1).length();
            let dRight = p0Right.subtract(pNRight).multiplyByFloats(1, 0, 1).length();
            let d = p0.subtract(pN).multiplyByFloats(1, 0, 1).length();
            
            let leftPoints = [];
            let rightPoints = [];
            for (let i = 0; i < points.length; i++) {
                let p = points[i].subtract(p0);
                p.scaleInPlace(dLeft / d);
                p.addInPlace(p0Left);
                p.y = points[i].y;
                leftPoints.push(p);
                p = points[i].subtract(p0);
                p.scaleInPlace(dRight / d);
                p.addInPlace(p0Right);
                p.y = points[i].y;
                rightPoints.push(p);
            }

            let shape: BABYLON.Vector3[] = [];
            let shapeCap: BABYLON.Vector3[] = [];
            /*
            shape.push(new BABYLON.Vector3(0, - thickVert * r - b, 0));
            shape.push(new BABYLON.Vector3(- thickLat * r + b, - thickVert * r - b, 0));
            shape.push(new BABYLON.Vector3(- thickLat * r - b, - thickVert * r + b, 0));
            shape.push(new BABYLON.Vector3(- thickLat * r - b, - b, 0));
            shape.push(new BABYLON.Vector3(- thickLat * r + b, b, 0));
            shape.push(new BABYLON.Vector3(- r - b, b, 0));
            for (let i = 0; i <= 6; i++) {
                let a = i / 6 * Math.PI;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                let p = new BABYLON.Vector3(-cosa * r, - sina * r, 0);
                shape.push(p);
            }
            shape.push(new BABYLON.Vector3(r + b, b, 0));
            shape.push(new BABYLON.Vector3(thickLat * r - b, b, 0));
            shape.push(new BABYLON.Vector3(thickLat * r + b, - b, 0));
            shape.push(new BABYLON.Vector3(thickLat * r + b, - thickVert * r + b, 0));
            shape.push(new BABYLON.Vector3(thickLat * r - b, - thickVert * r - b, 0));
            */

            shape.push(new BABYLON.Vector3(- W05, y0 - dH, 0));
            shape.push(new BABYLON.Vector3(- W05, y0 - dH, 0));
            shape.push(new BABYLON.Vector3(- W05, y0 + h - m, 0));
            shape.push(new BABYLON.Vector3(- W05 + m, y0 + h, 0));
            shape.push(new BABYLON.Vector3(- w05 - m, y0 + h, 0));
            shape.push(new BABYLON.Vector3(- w05, y0 + h - m, 0));
            shape.push(new BABYLON.Vector3(- w05, y0, 0));
            shape.push(new BABYLON.Vector3(- w05, y0, 0));
            shape.push(new BABYLON.Vector3(w05, y0, 0));
            shape.push(new BABYLON.Vector3(w05, y0, 0));
            shape.push(new BABYLON.Vector3(w05, y0 + h - m, 0));
            shape.push(new BABYLON.Vector3(w05 + m, y0 + h, 0));
            shape.push(new BABYLON.Vector3(W05 - m, y0 + h, 0));
            shape.push(new BABYLON.Vector3(W05, y0 + h - m, 0));
            shape.push(new BABYLON.Vector3(W05, y0 - dH, 0));
            shape.push(new BABYLON.Vector3(W05, y0 - dH, 0));

            shapeCap.push(new BABYLON.Vector3(- W05, y0 - dH, 0));
            shapeCap.push(new BABYLON.Vector3(- W05, y0 + h - m, 0));
            shapeCap.push(new BABYLON.Vector3(- W05 + m, y0 + h, 0));
            shapeCap.push(new BABYLON.Vector3(- w05 - m, y0 + h, 0));
            shapeCap.push(new BABYLON.Vector3(- w05, y0 + h - m, 0));
            shapeCap.push(new BABYLON.Vector3(- w05, y0, 0));
            shapeCap.push(new BABYLON.Vector3(w05, y0, 0));
            shapeCap.push(new BABYLON.Vector3(w05, y0 + h - m, 0));
            shapeCap.push(new BABYLON.Vector3(w05 + m, y0 + h, 0));
            shapeCap.push(new BABYLON.Vector3(W05 - m, y0 + h, 0));
            shapeCap.push(new BABYLON.Vector3(W05, y0 + h - m, 0));
            shapeCap.push(new BABYLON.Vector3(W05, y0 - dH, 0));
            
            track.shape = [
                new BABYLON.Vector3(- w05, y0 + h, 0),
                new BABYLON.Vector3(- W05, y0, 0),
                new BABYLON.Vector3(W05, y0, 0),
                new BABYLON.Vector3(w05, y0 + h, 0),
            ]
            
            let t = shape.length;

            let positions = [];
            let indices = [];
            let uvs = [];
            let normals = [];
            for (let i = 0; i < points.length; i++) {
                let right = rightPoints[i].subtract(leftPoints[i]).normalize();
                let dir: BABYLON.Vector3;
                let prev = points[i - 1];
                let point = points[i];
                let next = points[i + 1];
                if (prev && next) {
                    dir = next.subtract(prev).normalize();
                }
                else if (next) {
                    dir = next.subtract(point).normalize();
                    dir.x = Math.round(dir.x);
                    dir.y = Math.round(dir.y);
                    dir.z = Math.round(dir.z);
                }
                else if (prev) {
                    dir = point.subtract(prev).normalize();
                    dir.x = Math.round(dir.x);
                    dir.y = Math.round(dir.y);
                    dir.z = Math.round(dir.z);
                }
                let q = Mummu.QuaternionFromXYAxis(right, BABYLON.Vector3.Up());
                let m = BABYLON.Matrix.Compose(BABYLON.Vector3.One(), q, point);

                let idx0 = positions.length / 3;
                for (let n = 0; n <= t; n++) {
                    let sn = shape[n % shape.length].clone();
                    let sn1 = shape[(n + 1) % shape.length];
                    let tri = BABYLON.Vector3.DistanceSquared(sn, sn1) > 0;
                    let p = BABYLON.Vector3.TransformCoordinates(sn, m);
                    positions.push(p.x, p.y, p.z);
                    if (tri) {
                        if (i < points.length - 1) {
                            if (n < t) {
                                indices.push(idx0 + n, idx0 + n + (t + 1) + 1, idx0 + n + (t + 1));
                                indices.push(idx0 + n, idx0 + n + 1, idx0 + n + (t + 1) + 1);
                            }
                        }
                    }
                }
            }

            let capData = new BABYLON.VertexData();
            let capPositions = [];
            let capIndices = [];
            let capNormals = [];
            for (let i = 0; i < shapeCap.length; i++) {
                let p = shapeCap[i];
                capPositions.push(p.x, p.y, p.z);
                capNormals.push(0, 0, -1);
            }
            capIndices.push(0, 11, 6);
            capIndices.push(0, 6, 5);
            capIndices.push(0, 5, 4);
            capIndices.push(0, 4, 3);
            capIndices.push(0, 3, 2);
            capIndices.push(0, 2, 1);
            capIndices.push(11, 10, 9);
            capIndices.push(11, 9, 8);
            capIndices.push(11, 8, 7);
            capIndices.push(11, 7, 6);

            capData.positions = capPositions;
            capData.indices = capIndices;
            capData.normals = capNormals;

            let startCapData = Mummu.CloneVertexData(capData);
            let q = Mummu.QuaternionFromZYAxis(dirIn, BABYLON.Vector3.Up());
            Mummu.RotateVertexDataInPlace(startCapData, q);
            Mummu.TranslateVertexDataInPlace(startCapData, p0);

            let endCapData = Mummu.CloneVertexData(capData);
            q = Mummu.QuaternionFromZYAxis(dirOut.scale(-1), BABYLON.Vector3.Up());
            Mummu.RotateVertexDataInPlace(endCapData, q);
            Mummu.TranslateVertexDataInPlace(endCapData, pN);

            let woodData = new BABYLON.VertexData();
            woodData.positions = positions;
            woodData.indices = indices;
            BABYLON.VertexData.ComputeNormals(positions, indices, normals);
            woodData.normals = normals;

            Mummu.MergeVertexDatas(woodData, startCapData, endCapData).applyToMesh(track.mesh);
        }
    }
}
