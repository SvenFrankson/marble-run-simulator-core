namespace MarbleRunSimulatorCore {
    export class GravityWell extends MachinePart {
        public wellPath: BABYLON.Vector3[] = [];
        public wellMesh: BABYLON.Mesh;

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
            this.wellMesh = BABYLON.MeshBuilder.CreateLathe("gravitywell-mesh", { shape: this.wellPath, tessellation: 32, sideOrientation: BABYLON.Mesh.DOUBLESIDE });
            this.wellMesh.material = machine.game.materials.getMetalMaterial(0);

            this.wellMesh.position.copyFromFloats(tileWidth * 0.5, -tileHeight * 1.6, -tileDepth);
            this.wellMesh.parent = this;

            let wireTop = BABYLON.MeshBuilder.CreateTorus("wire-top", { diameter: tileWidth * 2, thickness: this.wireSize, tessellation: 32 });
            wireTop.material = this.wellMesh.material;
            wireTop.position.y = tileHeight * 1;
            wireTop.parent = this.wellMesh;

            let wireBottom = BABYLON.MeshBuilder.CreateTorus("wire-top", { diameter: 0.01 * 2, thickness: this.wireSize, tessellation: 32 });
            wireBottom.material = this.wellMesh.material;
            wireBottom.position.y = -0.01;
            wireBottom.parent = this.wellMesh;

            this.generateWires();
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
