namespace MarbleRunSimulatorCore {
    export interface IDoubleTrackMeshProps {
        
    }

    export class DoubleTrackMeshBuilder {

        public static async BuildDoubleTrackMesh(track: DoubleTrack, props: IDoubleTrackMeshProps): Promise<void> {
            if (track.mesh) {
                track.mesh.dispose();
            }

            track.mesh = new BABYLON.Mesh("track-mesh");
            track.mesh.parent = track.part;
            track.mesh.material = track.part.game.materials.getMaterial(track.part.getColor(0), track.part.machine.materialQ);
            
            let y0 = 0.004
            let y1 = 0.0018
            let y2 = 0.0006

            let x0 = 0.01;
            let x1 = 0.0066;
            let x2 = 0.0044;
            let x3 = 0.0016;

            let thickLat = 1.3;
            let thickVert = 1.3;
            //let b = 0.0005;

            let points = [...track.templateInterpolatedPoints];
            let ups = [...track.trackInterpolatedNormals];

            console.log(ups);
            
            Mummu.DecimatePathInPlace(points, (2 / 180) * Math.PI, ups);

            let p0 = points[0];
            let p1 = points[1];
            let dirIn = p1.subtract(p0).normalize();

            let pN1 = points[points.length - 2];
            let pN = points[points.length - 1];
            let dirOut = pN.subtract(pN1).normalize();

            let shape: BABYLON.Vector3[] = [];
            let shapeCap: BABYLON.Vector3[] = [];

            shape.push(new BABYLON.Vector3(- x0, y0, 0));
            shape.push(new BABYLON.Vector3(- x0, y0, 0));
            shape.push(new BABYLON.Vector3(- x1, y0, 0));
            shape.push(new BABYLON.Vector3(- x1, y0, 0));
            shape.push(new BABYLON.Vector3(- x2, y1, 0));
            shape.push(new BABYLON.Vector3(- x3, y2, 0));
            
            shape.push(new BABYLON.Vector3(x3, y2, 0));
            shape.push(new BABYLON.Vector3(x2, y1, 0));
            shape.push(new BABYLON.Vector3(x1, y0, 0));
            shape.push(new BABYLON.Vector3(x1, y0, 0));
            shape.push(new BABYLON.Vector3(x0, y0, 0));
            shape.push(new BABYLON.Vector3(x0, y0, 0));
            
            shape.push(new BABYLON.Vector3(x0, - y0, 0));
            shape.push(new BABYLON.Vector3(x0, - y0, 0));
            shape.push(new BABYLON.Vector3(x1, - y0, 0));
            shape.push(new BABYLON.Vector3(x1, - y0, 0));
            shape.push(new BABYLON.Vector3(x2, - y1, 0));
            shape.push(new BABYLON.Vector3(x3, - y2, 0));
            
            shape.push(new BABYLON.Vector3(- x3, - y2, 0));
            shape.push(new BABYLON.Vector3(- x2, - y1, 0));
            shape.push(new BABYLON.Vector3(- x1, - y0, 0));
            shape.push(new BABYLON.Vector3(- x1, - y0, 0));
            shape.push(new BABYLON.Vector3(- x0, - y0, 0));


            shapeCap.push(new BABYLON.Vector3(- x0, y0, 0));
            shapeCap.push(new BABYLON.Vector3(- x1, y0, 0));
            shapeCap.push(new BABYLON.Vector3(- x2, y1, 0));
            shapeCap.push(new BABYLON.Vector3(- x3, y2, 0));
            
            shapeCap.push(new BABYLON.Vector3(x3, y2, 0));
            shapeCap.push(new BABYLON.Vector3(x2, y1, 0));
            shapeCap.push(new BABYLON.Vector3(x1, y0, 0));
            shapeCap.push(new BABYLON.Vector3(x0, y0, 0));
            
            shapeCap.push(new BABYLON.Vector3(x0, - y0, 0));
            shapeCap.push(new BABYLON.Vector3(x1, - y0, 0));
            shapeCap.push(new BABYLON.Vector3(x2, - y1, 0));
            shapeCap.push(new BABYLON.Vector3(x3, - y2, 0));
            
            shapeCap.push(new BABYLON.Vector3(- x3, - y2, 0));
            shapeCap.push(new BABYLON.Vector3(- x2, - y1, 0));
            shapeCap.push(new BABYLON.Vector3(- x1, - y0, 0));
            shapeCap.push(new BABYLON.Vector3(- x0, - y0, 0));
            
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
                if (!prev) {
                    prev = point;
                }
                if (!next) {
                    next = point;
                }
                
                dir = next.subtract(prev).normalize();

                let q = Mummu.QuaternionFromZYAxis(dir, ups[i]);
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
            capIndices.push(0, 14, 1);
            capIndices.push(0, 15, 14);
            capIndices.push(1, 13, 2);
            capIndices.push(1, 14, 13);
            capIndices.push(2, 12, 3);
            capIndices.push(2, 13, 12);
            capIndices.push(3, 11, 4);
            capIndices.push(3, 12, 11);
            capIndices.push(4, 10, 5);
            capIndices.push(4, 11, 10);
            capIndices.push(5, 9, 6);
            capIndices.push(5, 10, 9);
            capIndices.push(6, 8, 7);
            capIndices.push(6, 9, 8);

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
            
            let doubleData = new BABYLON.VertexData();
            doubleData.positions = positions;
            doubleData.indices = indices;
            BABYLON.VertexData.ComputeNormals(positions, indices, normals);
            doubleData.normals = normals;

            Mummu.MergeVertexDatas(doubleData, startCapData, endCapData).applyToMesh(track.mesh);
        }
    }
}
