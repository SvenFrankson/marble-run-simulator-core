namespace MarbleRunSimulatorCore {
    export class Tools {
        public static V3Dir(angleInDegrees: number, length: number = 1): BABYLON.Vector3 {
            return new BABYLON.Vector3(Math.sin((angleInDegrees / 180) * Math.PI) * length, Math.cos((angleInDegrees / 180) * Math.PI) * length, 0);
        }

        public static IsWorldPosAConnexion(worldPos: BABYLON.Vector3): boolean {
            let dy = Math.abs(worldPos.y - Math.round(worldPos.y / tileHeight) * tileHeight);
            if (dy > 0.001) {
                return false;
            }

            let dxH = Math.abs(worldPos.x + tileSize * 0.5 - Math.round((worldPos.x + tileSize * 0.5) / tileSize) * tileSize);
            let dzV = Math.abs(worldPos.z - Math.round(worldPos.z / tileSize) * tileSize);
            if (dxH < 0.001 && dzV < 0.001) {
                return true;
            }

            let dxV = Math.abs(worldPos.x - Math.round((worldPos.x) / tileSize) * tileSize);
            let dzH = Math.abs(worldPos.z + tileSize * 0.5 - Math.round((worldPos.z + tileSize * 0.5) / tileSize) * tileSize);
            if (dxV < 0.001 && dzH < 0.001) {
                return true;
            }

            return false;
        }

        public static Box9SliceVertexData(min: BABYLON.Vector3, max: BABYLON.Vector3, margin: number): BABYLON.VertexData {
            let w = Math.abs(min.x - max.x);
            let h = Math.abs(min.y - max.y);
            let d = Math.abs(min.z - max.z);
            let c = min.add(max).scaleInPlace(0.5);

            let top = Mummu.Create9SliceVertexData({
                width: w,
                height: d,
                margin: margin
            });
            Mummu.RotateAngleAxisVertexDataInPlace(top, Math.PI * 0.5, BABYLON.Axis.X);
            let bottom = Mummu.TriFlipVertexDataInPlace(Mummu.CloneVertexData(top));

            Mummu.TranslateVertexDataInPlace(top, new BABYLON.Vector3(c.x, max.y, c.z));
            Mummu.TranslateVertexDataInPlace(bottom, new BABYLON.Vector3(c.x, min.y, c.z));

            let back = Mummu.Create9SliceVertexData({
                width: w,
                height: h,
                margin: margin
            });
            let front = Mummu.TriFlipVertexDataInPlace(Mummu.CloneVertexData(back));

            Mummu.TranslateVertexDataInPlace(front, new BABYLON.Vector3(c.x, c.y, max.z));
            Mummu.TranslateVertexDataInPlace(back, new BABYLON.Vector3(c.x, c.y, min.z));

            let right = Mummu.Create9SliceVertexData({
                width: d,
                height: h,
                margin: margin
            });
            Mummu.RotateAngleAxisVertexDataInPlace(right, - Math.PI * 0.5, BABYLON.Axis.Y);
            let left = Mummu.TriFlipVertexDataInPlace(Mummu.CloneVertexData(right));

            Mummu.TranslateVertexDataInPlace(right, new BABYLON.Vector3(max.x, c.y, c.z));
            Mummu.TranslateVertexDataInPlace(left, new BABYLON.Vector3(min.x, c.y, c.z));

            let boxData = Mummu.MergeVertexDatas(right, left, top, bottom, front, back);
            let boxDataFlipped = Mummu.TriFlipVertexDataInPlace(Mummu.CloneVertexData(boxData));
            Mummu.ColorizeVertexDataInPlace(boxDataFlipped, new BABYLON.Color3(0.5, 0.5, 0.5));

            boxData = Mummu.MergeVertexDatas(boxData, boxDataFlipped);

            return boxData;
        }
    }
}
