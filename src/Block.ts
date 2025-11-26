namespace MarbleRunSimulatorCore {

    export class Block extends BABYLON.Mesh {

        public line: BABYLON.Vector3[] = [];
        public boxColliders: Mummu.IBox[] = [];

        constructor(public machine: Machine) {
            super("block");
        }

        public dispose(): void {
            super.dispose();
            let index = this.machine.blocks.indexOf(this);
            if (index > -1) {
                this.machine.blocks.splice(index, 1);
            }
        }

        private _selected: boolean = false;
        public get selected(): boolean {
            return this._selected;
        }
        public select(_multiSelected?: boolean): void {
            this._selected = true;

            this.updateSelectorMeshVisibility();
        }

        public unselect(): void {
            this._selected = false;
            this.updateSelectorMeshVisibility();
        }
        
        public updateSelectorMeshVisibility(): void {
            this.renderOutline = this._selected;
            this.outlineWidth = UI3DConstants.outlineWidth;
            this.outlineColor = UI3DConstants.outlineSelectedColor;
        }

        public initialize(): void {
            this.line = [
                new BABYLON.Vector3(0, 4 * tileHeight, 0),
                new BABYLON.Vector3(0, 10 * tileHeight, 0)
            ]
        }

        public async instantiate(): Promise<void> {
            let vertexDatas: BABYLON.VertexData[] = [];
            this.boxColliders = [];

            for (let i = 0; i < this.line.length; i++) {
                let pt0 = this.line[i];
                let pt1 = this.line[i + 1];

                let pointVData = BABYLON.CreateCylinderVertexData({ height: 1 * tileSize + 0.005, diameter: 0.01 });
                Mummu.RotateAngleAxisVertexDataInPlace(pointVData, Math.PI * 0.5, BABYLON.Axis.X);
                Mummu.TranslateVertexDataInPlace(pointVData, pt0);
                vertexDatas.push(pointVData);

                if (pt0 && pt1) {
                    let l = BABYLON.Vector3.Distance(pt0, pt1);
                    if (l > 0) {
                        let panelVData = BABYLON.CreateBoxVertexData({ width: 0.008, height: l + 0.002, depth: 1 * tileSize });
                        let q = Mummu.QuaternionFromYZAxis(pt1.subtract(pt0), BABYLON.Axis.Z);
                        let t = pt0.add(pt1).scale(0.5);
                        Mummu.RotateVertexDataInPlace(panelVData, q);
                        Mummu.TranslateVertexDataInPlace(panelVData, t);
                        let boxCollider: Mummu.IBox = {
                            width: 0.005,
                            height: l,
                            depth: 3 * tileSize,
                            worldMatrix: BABYLON.Matrix.Compose(BABYLON.Vector3.One(), q, t)
                        };
                        this.boxColliders.push(boxCollider);
                        vertexDatas.push(panelVData);
                    }
                }
            }

            if (vertexDatas.length > 0) {
                Mummu.MergeVertexDatas(...vertexDatas).applyToMesh(this);
            }
            else {
                (new BABYLON.VertexData()).applyToMesh(this);
            }
            this.material = this.machine.game.materials.getMaterial(0, this.machine.materialQ);
        }

        public clean(): void {
            for (let i = 0; i < this.line.length - 1; i++) {
                let pt0 = this.line[i];
                let pt1 = this.line[i + 1];
                if (BABYLON.Vector3.DistanceSquared(pt0, pt1) === 0) {
                    this.line.splice(i, 1);
                    i--;
                }
            }
        }

        public worldPosToIndex(worldPos: BABYLON.Vector3): number {
            let bestIndex: number = -1;
            let bestDistanceSquared: number = Infinity;

            for (let i = 0; i < 2 * this.line.length; i++) {
                let n = Math.floor(i / 2);

                let p = this.line[n];
                if (i % 2 === 1 && this.line[n + 1]) {
                    p = p.add(this.line[n + 1]).scale(0.5);
                }
                
                let distSquared = BABYLON.Vector3.DistanceSquared(worldPos, p);
                if (distSquared < bestDistanceSquared) {
                    bestIndex = i;
                    bestDistanceSquared = distSquared;
                }
            }

            return bestIndex;
        }

        public splitAtIndex(n: number): void {
            let i = Math.floor(n / 2)
            let pt1 = this.line[i];
            let pt2 = this.line[i + 1];
            if (pt1 && pt2) {
                let p = pt1.add(pt2).scale(0.5);
                this.line.splice(i + 1, 0, p);
            }
        }

        public intersectsMachinePart(part: MachinePart, i?: number, j?: number, k?: number): number {
            let pos = part.position;
            let d = BABYLON.Vector3.Zero();
            if (isFinite(i) && isFinite(j) && isFinite(k)) {
                pos = pos.clone();
                pos.x = i * tileSize;
                pos.y = k * tileHeight;
                pos.z = j * tileSize;
                d = pos.subtract(part.position);
            }
            if (!Mummu.AABBAABBCheck(this.getBoundingInfo().minimum, this.getBoundingInfo().maximum, part.localAABBMin.add(pos), part.localAABBMax.add(pos))) {
                return 0;
            }
            for (let i = 0; i < this.line.length - 1; i++) {
                let pt0 = this.line[i];
                let pt1 = this.line[i + 1];
                let l = BABYLON.Vector3.Distance(pt0, pt1);
                let dir = pt1.subtract(pt0).normalize();
                let ray = new BABYLON.Ray(pt0.subtract(d), dir, l);
                let pick = ray.intersectsMesh(part.selectorBodyLogic);
                if (pick && pick.hit) {
                    Mummu.DrawDebugPoint(pick.pickedPoint, 600, BABYLON.Color3.Red(), 0.05);
                    let axis = pick.pickedPoint.subtract(part.getBarycenter().add(d));
                    axis.x = Math.abs(axis.x);
                    axis.y = Math.abs(axis.y);
                    axis.z = Math.abs(axis.z);
                    if (axis.x >= axis.y && axis.x >= axis.y) {
                        return 1;
                    }
                    if (axis.z >= axis.y) {
                        return 2;
                    }
                    return 3;
                }
            }
            return 0;
        }
    }
}