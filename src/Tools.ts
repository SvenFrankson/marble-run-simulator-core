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
    }
}
