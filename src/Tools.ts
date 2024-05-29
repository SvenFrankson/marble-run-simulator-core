namespace MarbleRunSimulatorCore {
    export class Tools {
        public static V3Dir(angleInDegrees: number, length: number = 1): BABYLON.Vector3 {
            return new BABYLON.Vector3(Math.sin((angleInDegrees / 180) * Math.PI) * length, Math.cos((angleInDegrees / 180) * Math.PI) * length, 0);
        }

        public static IsWorldPosAConnexion(worldPos: BABYLON.Vector3): boolean {
            let dx = Math.abs((worldPos.x + tileWidth * 0.5) - Math.round((worldPos.x + tileWidth * 0.5) / tileWidth) * tileWidth);
            if (dx > 0.001) {
                return false;
            }
            let dy = Math.abs(worldPos.y - Math.round(worldPos.y / tileHeight) * tileHeight);
            if (dy > 0.001) {
                return false;
            }
            let dz = Math.abs(worldPos.z - Math.round(worldPos.z / tileDepth) * tileDepth);
            if (dz > 0.001) {
                return false;
            }
            return true;
        }
    }
}
