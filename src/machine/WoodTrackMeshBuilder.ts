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
            
            let r = track.tubeRadius;
            let thickLat = 1.3;
            let thickVert = 1.3;
            //let b = 0.0005;

            let points = [...track.templateInterpolatedPoints].map((p) => {
                return p.add(new BABYLON.Vector3(0, track.radiusToRaise(track.tubeRadius), 0));
            });
            
            Mummu.DecimatePathInPlace(points, (2 / 180) * Math.PI);

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

            p0.addInPlace(dirIn.scale(0.0005));
            pN.subtractInPlace(dirOut.scale(0.0005));

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

            shape.push(new BABYLON.Vector3(0, - thickVert * r, 0));
            shape.push(new BABYLON.Vector3(- thickLat * r, - thickVert * r, 0));
            shape.push(new BABYLON.Vector3(- thickLat * r, - thickVert * r, 0));
            shape.push(new BABYLON.Vector3(- thickLat * r, 0, 0));
            shape.push(new BABYLON.Vector3(- thickLat * r, 0, 0));
            shape.push(new BABYLON.Vector3(- r, 0, 0));
            for (let i = 0; i <= 6; i++) {
                let a = i / 6 * Math.PI;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                let p = new BABYLON.Vector3(-cosa * r, - sina * r, 0);
                shape.push(p);
            }
            shape.push(new BABYLON.Vector3(r, 0, 0));
            shape.push(new BABYLON.Vector3(thickLat * r, 0, 0));
            shape.push(new BABYLON.Vector3(thickLat * r, 0, 0));
            shape.push(new BABYLON.Vector3(thickLat * r, - thickVert * r, 0));
            shape.push(new BABYLON.Vector3(thickLat * r, - thickVert * r, 0));
            shape.push(new BABYLON.Vector3(0, - thickVert * r, 0));
            
            shapeCap.push(new BABYLON.Vector3(- thickLat * r, - thickVert * r, 0));
            shapeCap.push(new BABYLON.Vector3(- thickLat * r, 0, 0));
            for (let i = 0; i <= 6; i++) {
                let a = i / 6 * Math.PI;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                let p = new BABYLON.Vector3(-cosa * r, - sina * r, 0);
                shapeCap.push(p);
            }
            shapeCap.push(new BABYLON.Vector3(thickLat * r, 0, 0));
            shapeCap.push(new BABYLON.Vector3(thickLat * r, - thickVert * r, 0));

            console.log(shapeCap.length);
            
            let t = shape.length;

            let positions = [];
            let indices = [];
            let uvs = [];
            let normals = [];
            for (let i = 0; i < points.length; i++) {
                let dir: BABYLON.Vector3;
                let prev = points[i - 1];
                let point = points[i];
                let next = points[i + 1];
                if (prev && next) {
                    dir = next.subtract(prev).normalize();
                }
                else if (next) {
                    dir = next.subtract(point);
                    dir.x = Math.sign(dir.x);
                    dir.y = 0;
                    dir.z = 0;
                }
                else if (prev) {
                    dir = point.subtract(prev);
                    dir.x = Math.sign(dir.x);
                    dir.y = 0;
                    dir.z = 0;
                }
                let q = Mummu.QuaternionFromZYAxis(dir, BABYLON.Vector3.Up());
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
            capIndices.push(0, 10, 5);
            capIndices.push(0, 5, 4);
            capIndices.push(0, 4, 3);
            capIndices.push(0, 3, 2);
            capIndices.push(0, 2, 1);
            capIndices.push(10, 6, 5);
            capIndices.push(10, 7, 6);
            capIndices.push(10, 8, 7);
            capIndices.push(10, 9, 8);

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
