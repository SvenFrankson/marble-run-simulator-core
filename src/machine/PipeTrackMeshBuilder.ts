namespace MarbleRunSimulatorCore {
    export interface IPipeTrackMeshProps {
        
    }

    export class PipeTrackMeshBuilder {

        public static async BuildPipeTrackMesh(track: PipeTrack, props: IPipeTrackMeshProps): Promise<void> {
            let vertexDataLoader = track.part.game.vertexDataLoader;

            if (track.ringsMesh) {
                track.ringsMesh.dispose();
            }
            if (track.tubeMesh) {
                track.tubeMesh.dispose();
            }

            track.ringsMesh = new BABYLON.Mesh("pipetrack-rings-mesh");
            track.ringsMesh.parent = track.part;
            track.ringsMesh.material = track.part.game.materials.getMaterial(track.part.getColor(0), track.part.machine.materialQ);
            
            track.tubeMesh = new BABYLON.Mesh("pipetrack-tube-mesh");
            track.tubeMesh.parent = track.part;
            let tubeMaterial = track.part.game.materials.getPlexiglasMaterial(track.part.getColor(0), track.part.machine.materialQ);
            if (tubeMaterial) {
                track.tubeMesh.material = tubeMaterial;
            }
            else {
                track.tubeMesh.material = track.ringsMesh.material;
            }

            let ringIn = await vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/steampunk-pipe.babylon", 0);
            ringIn = Mummu.CloneVertexData(ringIn);
            let ringOut = Mummu.CloneVertexData(ringIn);

            let p0 = track.templateInterpolatedPoints[0];
            let p1 = track.templateInterpolatedPoints[1];
            let normIn = track.trackInterpolatedNormals[0];
            let dirIn = p1.subtract(p0).normalize();
            dirIn.x = Math.round(dirIn.x);
            dirIn.y = Math.round(dirIn.y);
            dirIn.z = Math.round(dirIn.z);
            //Mummu.DrawDebugLine(p0, p0.add(dirIn), 300, BABYLON.Color3.Red()).parent = track.part;

            let pN1 = track.templateInterpolatedPoints[track.templateInterpolatedPoints.length - 2];
            let pN = track.templateInterpolatedPoints[track.templateInterpolatedPoints.length - 1];
            let normOut = track.trackInterpolatedNormals[track.trackInterpolatedNormals.length - 1];
            let dirOut = pN.subtract(pN1).normalize();
            dirOut.x = Math.round(dirOut.x);
            dirOut.y = Math.round(dirOut.y);
            dirOut.z = Math.round(dirOut.z);
            //Mummu.DrawDebugLine(pN, pN.add(dirOut), 300, BABYLON.Color3.Green()).parent = track.part;

            Mummu.RotateVertexDataInPlace(ringIn, Mummu.QuaternionFromZYAxis(dirIn, normIn));
            Mummu.RotateVertexDataInPlace(ringOut, Mummu.QuaternionFromZYAxis(dirOut.scale(-1), normOut));

            Mummu.TranslateVertexDataInPlace(ringIn, p0);
            Mummu.TranslateVertexDataInPlace(ringOut, pN);

            let points = [...track.templateInterpolatedPoints].map((p) => {
                return p.clone();
            });
            let normals = [...track.trackInterpolatedNormals].map((p) => {
                return p.clone();
            });
            Mummu.RemoveFromStartForDistanceInPlace(points, 0.001);
            Mummu.RemoveFromEndForDistanceInPlace(points, 0.001);
            Mummu.DecimatePathInPlace(points, (2 / 180) * Math.PI, normals);

            if (track.template.pipeIgnoresTrackNormals) {
                points = points.map((pt, i) => {
                    return pt.add(BABYLON.Vector3.Up().scale(0.0085));
                });
            }
            else {
                points = points.map((pt, i) => {
                    return pt.add(normals[i].scale(0.0085));
                });
            }
            
            let pipeData = Mummu.CreateWireVertexData({ path: points, pathUps: track.template.pipeIgnoresTrackNormals ? undefined : normals, tesselation: 12, radius: 0.011, color: new BABYLON.Color4(1, 1, 1, 1), closed: false, textureRatio: 4 });
            let flip = Mummu.CloneVertexData(pipeData);
            Mummu.TriFlipVertexDataInPlace(flip);

            //for (let i = 0; i < points.length; i++) {
            //    let cube = BABYLON.CreateBoxVertexData({ size: 0.001 });
            //    Mummu.TranslateVertexDataInPlace(cube, points[i]);
            //    allDatas.push(cube);
            //}

            Mummu.MergeVertexDatas(ringIn, ringOut).applyToMesh(track.ringsMesh);
            Mummu.MergeVertexDatas(pipeData, flip).applyToMesh(track.tubeMesh);
        }
    }
}
