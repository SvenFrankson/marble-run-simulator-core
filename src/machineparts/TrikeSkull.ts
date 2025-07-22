namespace MarbleRunSimulatorCore {
    export class TrikeSkull extends MachinePart {

        public skull: BABYLON.Mesh;

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);
            this.setColorCount(1);

            this.setTemplate(this.machine.templateManager.getTemplate(TrikeSkull.PropToPartName(prop)));

            this.skull = new BABYLON.Mesh("skull");
            this.skull.parent = this;
            this.skull.material = this.game.materials.bone;

            this.generateWires();
        }
        

        public static PropToPartName(prop: IMachinePartProp): string {
            return "trikeSkull";
        }

        protected async instantiateMachineSpecific(): Promise<void> {

            let triceratopsVertexData = await this.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/triceratops.babylon");
            triceratopsVertexData[0].applyToMesh(this.skull);
        }

        public static GenerateTemplate(): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "trikeSkull";

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].colorIndex = 0;
            template.trackTemplates[0].trackpoints = [
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(- tileSize * 11.5, tileHeight * 12, 0), Tools.V3Dir(90), Tools.V3Dir(0)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileSize * 2, tileHeight * 8, 0)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileSize * 8.5, tileHeight * 10, 0), Tools.V3Dir(90), Tools.V3Dir(0)),
            ];

            template.initialize();

            return template;
        }
    }
}
