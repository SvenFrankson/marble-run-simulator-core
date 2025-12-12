namespace MarbleRunSimulatorCore {
    
    export class Star extends MachinePart {

        public starMesh: BABYLON.Mesh;

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);
            this.setColorCount(1);

            this.setTemplate(this.machine.templateManager.getTemplate(Star.PropToPartName(prop)));

            this.starMesh = new BABYLON.Mesh("body");
            if (MainMaterials.UseOutlineMeshes) {
                MainMaterials.SetAsOutlinedMesh(this.starMesh);
            }
            this.starMesh.parent = this;

            this.localAABBBaseMin.x = - 0.5 * tileSize;
            this.localAABBBaseMin.y = - 0.5 * tileHeight;
            this.localAABBBaseMax.x = 0.5 * tileSize;
            this.localAABBBaseMax.y = 0.5 * tileHeight;

            this.generateWires();
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            let partName = "star";
            return partName;
        }
        
        protected async instantiateMachineSpecific(): Promise<void> {
            let starData = await this.game.vertexDataLoader.getAtIndex("./lib/marble-run-simulator-core/datas/meshes/star.babylon", 0);
            starData = Mummu.ScaleVertexDataInPlace(Mummu.CloneVertexData(starData), tileSize * 0.8);
            starData.applyToMesh(this.starMesh);
            this.starMesh.material = this.game.materials.getMaterial(this.getColor(0), this.machine.materialQ);
        }

        public onBeforeApplyingSelectorMeshLogicVertexData(selectorMeshLogicVertexDatas: BABYLON.VertexData[]): void {
            let bodySelector = BABYLON.CreateBoxVertexData({ width: tileSize, height: tileHeight, depth: tileSize });
            selectorMeshLogicVertexDatas.push(bodySelector);
        }

        private _collected: boolean = false;
        public get collected(): boolean {
            return this._collected;
        }
        public collect(): void {
            this.starMesh.visibility = 0.2;
            this._collected = true;
        }
        public uncollect(): void {
            this.starMesh.visibility = 1;
            this._collected = false;
        }

        public static GenerateTemplate(): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "star";

            let rayon = new BABYLON.Vector3(0, tileSize * 0.4, 0);
            let shape = new MiniatureShape();
            shape.points = [];
            for (let i = 0; i < 5; i++) {
                Mummu.RotateInPlace(rayon, BABYLON.Axis.Z, 2 * Math.PI / 10);
                shape.points.push(rayon.scale(0.6));
                Mummu.RotateInPlace(rayon, BABYLON.Axis.Z, 2 * Math.PI / 10);
                shape.points.push(rayon.clone());
            }
            shape.colorSlot = 0;
            shape.fill = false;
            shape.updateCenter();
            template.miniatureShapes.push(shape);

            template.initialize();

            return template;
        }
    }
}
