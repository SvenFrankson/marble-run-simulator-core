namespace MarbleRunSimulatorCore {
    export class End extends MachinePart {

        public panel: BABYLON.Mesh;
        public panelSupport: BABYLON.Mesh;
        public panelPicture: BABYLON.Mesh;

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            this.setTemplate(this.machine.templateManager.getTemplate(End.PropToPartName(prop)));

            if (isNaN(this.colors[1])) {
                this.colors[1] = 0;
            }
            if (isNaN(this.colors[2])) {
                this.colors[2] = 17;
            }

            this.panel = new BABYLON.Mesh("panel");
            this.panel.position = new BABYLON.Vector3((this.mirrorX ? tileWidth * 0.6 : tileWidth * 0.4), 0.6 * tileHeight - 0.005, this.wireGauge * 0.5);
            this.panel.parent = this;
            
            this.panelSupport = new BABYLON.Mesh("panel-support");
            this.panelSupport.parent = this.panel;
            
            this.panelPicture = new BABYLON.Mesh("panel-picture");
            this.panelPicture.parent = this.panel;

            this.generateWires();
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            return "end";
        }
        
        protected async instantiateMachineSpecific(): Promise<void> {
            let panelData = await this.game.vertexDataLoader.get("./lib/marble-run-simulator-core/datas/meshes/panel.babylon");
            panelData[0].applyToMesh(this.panel);
            this.panel.material = this.game.materials.getMaterial(this.getColor(2), this.machine.materialQ);
            panelData[1].applyToMesh(this.panelSupport);
            this.panelSupport.material = this.game.materials.getMaterial(this.getColor(1), this.machine.materialQ);
            panelData[2].applyToMesh(this.panelPicture);
            this.panelPicture.material = this.game.materials.getBallMaterial(
                this.game.materials.baseMaterialIndexToBallMaterialIndex(this.getColor(1)),
                this.machine.materialQ
            );
        }

        public static GenerateTemplate(mirrorX?: boolean): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "end";
            template.l = 2;

            template.mirrorX = mirrorX;

            template.xMirrorable = true;

            let x0 = tileWidth * 0.4;
            let y0 = 0.6 * tileHeight;
            let w = tileWidth * 0.5;
            let r = 0.01;
            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].colorIndex = 0;
            template.trackTemplates[0].trackpoints = [
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5, 2 * tileHeight, 0), Tools.V3Dir(90)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(0, 2 * tileHeight - 0.01, 0), Tools.V3Dir(120))
            ];

            template.trackTemplates[1] = new TrackTemplate(template);
            template.trackTemplates[1].colorIndex = 1;
            template.trackTemplates[1].trackpoints = [
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 - w, y0 + 1.6 * r, 0), Tools.V3Dir(180), Tools.V3Dir(90)),
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 - w, y0 + r, 0), Tools.V3Dir(180)),
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 - w + r, y0, 0), Tools.V3Dir(90)),
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 - 0.012, y0, 0), Tools.V3Dir(90)),
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 - 0.001, y0 - 0.005, 0), Tools.V3Dir(90)),
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0, y0 - 0.005, 0), Tools.V3Dir(90)),
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 + 0.001, y0 - 0.005, 0), Tools.V3Dir(90)),
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 + 0.012, y0, 0), Tools.V3Dir(90)),
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 + w - r, y0, 0), Tools.V3Dir(90)),
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 + w, y0 + r, 0), Tools.V3Dir(0)),
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 + w, y0 + 1.6 * r, 0), Tools.V3Dir(0), Tools.V3Dir(-90)),
            ];
            template.trackTemplates[1].drawStartTip = true;
            template.trackTemplates[1].drawEndTip = true;

            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }

            template.initialize();

            return template;
        }
    }
}
