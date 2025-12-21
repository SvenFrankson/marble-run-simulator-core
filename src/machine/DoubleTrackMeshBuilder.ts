namespace MarbleRunSimulatorCore {
    export interface IDoubleTrackMeshProps {
        
    }

    export class DoubleTrackMeshBuilder {

        public static async BuildDoubleTrackMesh(track: DoubleTrack, props: IDoubleTrackMeshProps): Promise<void> {
            if (track.mesh) {
                track.mesh.dispose();
            }

            let shape: BABYLON.Vector3[] = [];
            for (let i = 0; i < 6; i++) {
                let a = (i / 6) * 2 * Math.PI;
                let cosa = Math.cos(a);
                let sina = Math.sin(a);
                shape[i] = new BABYLON.Vector3(cosa * 0.003, sina * 0.003, 0);
            }

            track.mesh = BABYLON.ExtrudeShape("wire", { shape: shape, path: track.templateInterpolatedPoints, closeShape: true, cap: BABYLON.Mesh.CAP_ALL });

            let data = BABYLON.VertexData.ExtractFromMesh(track.mesh);
            Mummu.TranslateVertexDataInPlace(data, new BABYLON.Vector3(0, 0, track.part.wireGauge * 0.5));
            let data2 = Mummu.CloneVertexData(data);
            Mummu.TranslateVertexDataInPlace(data2, new BABYLON.Vector3(0, 0, - track.part.wireGauge));
            Mummu.MergeVertexDatas(data, data2).applyToMesh(track.mesh);

            if (MainMaterials.UseOutlineMeshes) {
                MainMaterials.SetAsOutlinedMesh(track.mesh);
            }
            track.mesh.parent = track.part;
            track.mesh.material = track.part.game.materials.getMaterial(track.part.getColor(0), track.part.machine.materialQ);
            
        }
    }
}
