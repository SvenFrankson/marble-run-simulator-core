namespace MarbleRunSimulatorCore {
    export class GravityWell extends MachinePart {
        public wellPath: BABYLON.Vector3[] = [];
        public wellMesh: BABYLON.Mesh;
        public circleTop: BABYLON.Mesh;
        public circleBottom: BABYLON.Mesh;

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            let partName = "gravitywell";
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX));

            this.wellPath = [new BABYLON.Vector3(0.012, 0, 0), new BABYLON.Vector3(tileWidth, tileHeight * 0.9, 0)];
            Mummu.CatmullRomPathInPlace(this.wellPath, Tools.V3Dir(0), Tools.V3Dir(0));
            Mummu.CatmullRomPathInPlace(this.wellPath, Tools.V3Dir(0), Tools.V3Dir(0));
            Mummu.CatmullRomPathInPlace(this.wellPath, Tools.V3Dir(0), Tools.V3Dir(0));
            Mummu.CatmullRomPathInPlace(this.wellPath, Tools.V3Dir(0), Tools.V3Dir(0));

            this.wellPath.splice(0, 0, new BABYLON.Vector3(0.01, -0.01, 0));
            this.wellPath.push(new BABYLON.Vector3(tileWidth, tileHeight * 1, 0));

            this.wellMesh = new BABYLON.Mesh("gravitywell-mesh");
            this.wellMesh.position.copyFromFloats(tileWidth * 0.5, -tileHeight * 1.6, -tileDepth);
            this.wellMesh.parent = this;

            this.circleTop = new BABYLON.Mesh("wire-top");
            this.circleTop.position.copyFromFloats(tileWidth * 0.5, -tileHeight * 1.6, -tileDepth).scaleInPlace;
            this.circleTop.position.y += tileHeight * 1;
            this.circleTop.parent = this;

            this.circleBottom = new BABYLON.Mesh("wire-top");
            this.circleBottom.position.copyFromFloats(tileWidth * 0.5, -tileHeight * 1.6, -tileDepth).scaleInPlace;
            this.circleBottom.position.y += -0.01;
            this.circleBottom.parent = this;

            this.generateWires();
        }

        protected async instantiateMachineSpecific(): Promise<void> {
            if (this.wellMesh) {
                this.wellMesh.dispose();
            }
            this.wellMesh = BABYLON.MeshBuilder.CreateLathe("gravitywell-mesh", { shape: this.wellPath, tessellation: 32, sideOrientation: BABYLON.Mesh.DOUBLESIDE });
            this.wellMesh.position.copyFromFloats(tileWidth * 0.5, -tileHeight * 1.6, -tileDepth);
            this.wellMesh.parent = this;
            this.wellMesh.material = this.machine.game.materials.getMetalMaterial(0);
            
            BABYLON.CreateTorusVertexData({ diameter: tileWidth * 2, thickness: this.wireSize, tessellation: 32 }).applyToMesh(this.circleTop);
            this.circleTop.material = this.wellMesh.material;
            
            BABYLON.CreateTorusVertexData({ diameter: 0.01 * 2, thickness: this.wireSize, tessellation: 32 }).applyToMesh(this.circleBottom);
            this.circleBottom.material = this.wellMesh.material;
        }

        public static GenerateTemplate(mirrorX?: boolean): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.w = 2;
            template.h = 3;
            template.d = 3;
            template.partName = "gravitywell";

            template.mirrorX = mirrorX;

            template.xMirrorable = true;

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5, 0, 0), Tools.V3Dir(90)), new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.2 + tileWidth * 0.5, -0.01, 0), Tools.V3Dir(120))];

            template.trackTemplates[1] = new TrackTemplate(template);
            template.trackTemplates[1].trackpoints = [new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.2 + tileWidth * 0.5, -tileHeight * template.h + 0.025, -tileDepth), Tools.V3Dir(150)), new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * 1.5, -tileHeight * template.h, -tileDepth), Tools.V3Dir(90))];
            template.trackTemplates[1].drawStartTip = true;

            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }

            template.initialize();

            return template;
        }
    }
}
