namespace MarbleRunSimulatorCore {
    export interface IPipeTrackMeshProps {
        
    }

    export class PipeTrackMeshBuilder {

        public static async BuildPipeTrackMesh(track: Track, props: IPipeTrackMeshProps): Promise<void> {
            let vertexDataLoader = track.part.game.vertexDataLoader;

            if (track.mesh) {
                track.mesh.dispose();
            }

            track.mesh = new BABYLON.Mesh("track-mesh");
            track.mesh.parent = track.part;
            track.mesh.material = track.part.game.materials.getMaterial(1);

            let ringIn = await vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/steampunk-pipe.babylon", 0);
            ringIn = Mummu.CloneVertexData(ringIn);
            let ringOut = Mummu.CloneVertexData(ringIn);

            let p0 = track.templateInterpolatedPoints[0];
            let p1 = track.templateInterpolatedPoints[1];
            let normIn = track.trackInterpolatedNormals[0];
            let dirIn = p1.subtract(p0).normalize();
            Mummu.DrawDebugLine(p0, p0.add(dirIn), 300, BABYLON.Color3.Red()).parent = track.part;

            let pN1 = track.templateInterpolatedPoints[track.templateInterpolatedPoints.length - 2];
            let pN = track.templateInterpolatedPoints[track.templateInterpolatedPoints.length - 1];
            let normOut = track.trackInterpolatedNormals[track.trackInterpolatedNormals.length - 1];
            let dirOut = pN.subtract(pN1).normalize();
            Mummu.DrawDebugLine(pN, pN.add(dirOut), 300, BABYLON.Color3.Green()).parent = track.part;

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
            Mummu.DecimatePathInPlace(points, (4 / 180) * Math.PI, normals);

            points = points.map((pt, i) => {
                return pt.add(normals[i].scale(0.008));
            });
            
            let pipeData = Mummu.CreateWireVertexData({ path: points, pathUps: normals, tesselation: 12, radius: 0.01, color: new BABYLON.Color4(1, 1, 1, 1), closed: false, textureRatio: 4 });

            Mummu.MergeVertexDatas(ringIn, ringOut, pipeData).applyToMesh(track.mesh);
        }
    }
}
