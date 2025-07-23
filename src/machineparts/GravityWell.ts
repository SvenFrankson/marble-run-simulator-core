namespace MarbleRunSimulatorCore {
    export class GravityWell extends MachinePart {
        public wellPath: BABYLON.Vector3[] = [];
        public wellMesh: BABYLON.Mesh;
        public circleTop: BABYLON.Mesh;
        public circleBottom: BABYLON.Mesh;

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);
            this.setColorCount(3);

            this.setTemplate(this.machine.templateManager.getTemplate(GravityWell.PropToPartName(prop), prop.mirrorX));

            this.wellPath = [new BABYLON.Vector3(0.012, -0.005, 0), new BABYLON.Vector3(tileWidth, tileHeight * 1.2, 0)];
            Mummu.CatmullRomPathInPlace(this.wellPath, Tools.V3Dir(0), Tools.V3Dir(0));
            Mummu.CatmullRomPathInPlace(this.wellPath, Tools.V3Dir(0), Tools.V3Dir(0));
            Mummu.CatmullRomPathInPlace(this.wellPath, Tools.V3Dir(0), Tools.V3Dir(0));
            Mummu.CatmullRomPathInPlace(this.wellPath, Tools.V3Dir(0), Tools.V3Dir(0));

            this.wellPath.splice(0, 0, new BABYLON.Vector3(0.01, -0.01, 0));
            this.wellPath.push(new BABYLON.Vector3(tileWidth, tileHeight * 1.3, 0));

            this.wellMesh = new BABYLON.Mesh("gravitywell-mesh");
            this.wellMesh.position.copyFromFloats(tileWidth * 0.5, -tileHeight * 1.9, -tileDepth);
            this.wellMesh.parent = this;

            this.circleTop = new BABYLON.Mesh("wire-top");
            this.circleTop.position.copyFromFloats(tileWidth * 0.5, - tileHeight * 0.6, -tileDepth);
            this.circleTop.parent = this;

            this.circleBottom = new BABYLON.Mesh("wire-top");
            this.circleBottom.position.copyFromFloats(tileWidth * 0.5, - tileHeight * 1.9 - 0.01, -tileDepth);
            this.circleBottom.parent = this;

            this.generateWires();
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            return "gravitywell";
        }

        protected async instantiateMachineSpecific(): Promise<void> {
            if (this.wellMesh) {
                this.wellMesh.dispose();
            }
            this.wellMesh = BABYLON.MeshBuilder.CreateLathe("gravitywell-mesh", { shape: this.wellPath, tessellation: 32, sideOrientation: BABYLON.Mesh.DOUBLESIDE });
            this.wellMesh.position.copyFromFloats(tileWidth * 0.5, -tileHeight * 1.9, -tileDepth);
            this.wellMesh.parent = this;
            this.wellMesh.material = this.machine.game.materials.getMaterial(this.getColor(2), this.machine.materialQ);
            
            BABYLON.CreateTorusVertexData({ diameter: tileWidth * 2, thickness: this.wireSize, tessellation: 32 }).applyToMesh(this.circleTop);
            this.circleTop.material = this.wellMesh.material;
            
            BABYLON.CreateTorusVertexData({ diameter: 0.01 * 2, thickness: this.wireSize, tessellation: 32 }).applyToMesh(this.circleBottom);
            this.circleBottom.material = this.wellMesh.material;
        }

        public static GenerateTemplate(mirrorX?: boolean): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.l = 2;
            template.h = 3;
            template.d = 3;
            template.partName = "gravitywell";

            template.mirrorX = mirrorX;

            template.xMirrorable = true;

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].colorIndex = 0;
            template.trackTemplates[0].trackpoints = [
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5, 0, 0), Tools.V3Dir(90))
            ];

            for (let n = 0; n <= 7; n++) {
                let a = n * Math.PI / 4;
                let x = Math.sin(a) * tileWidth;
                let z = Math.cos(a) * tileWidth;

                let f = n / 7;
                let dir = undefined;
                let norm = (new BABYLON.Vector3(- x, 0, - z)).normalize();
                BABYLON.Vector3.SlerpToRef(BABYLON.Vector3.Up(), norm, f, norm);
                norm.normalize();

                if (n === 7) {
                    dir = new BABYLON.Vector3(1, -0.1, 1).normalize();
                    x += 0.002;
                }

                template.trackTemplates[0].trackpoints.push(
                    new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * 0.5 + x, - 0.007 * n / 7, - tileDepth + z), dir, norm)
                );
            }
            template.trackTemplates[0].drawEndTip = true;

            template.trackTemplates[1] = new TrackTemplate(template);
            template.trackTemplates[1].colorIndex = 1;
            template.trackTemplates[1].trackpoints = [
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.2 + tileWidth * 0.5, -tileHeight * template.h + 0.01, -tileDepth), Tools.V3Dir(130), undefined, undefined, 0.8),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileWidth * 1.5, -tileHeight * template.h, -tileDepth), Tools.V3Dir(90))
            ];
            template.trackTemplates[1].drawStartTip = true;

            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }

            template.initialize();

            let wellPath = [new BABYLON.Vector3(0.012, 0, 0), new BABYLON.Vector3(tileWidth, tileHeight * 0.9, 0)];
            Mummu.CatmullRomPathInPlace(wellPath, Tools.V3Dir(0), Tools.V3Dir(0));
            Mummu.CatmullRomPathInPlace(wellPath, Tools.V3Dir(0), Tools.V3Dir(0));
            wellPath.splice(0, 0, new BABYLON.Vector3(0.01, -0.01, 0));

            for (let i = 0; i < wellPath.length - 1; i++) {
                let c = new BABYLON.Vector3(tileWidth * 0.5, -tileHeight * 1.6, -tileDepth);
                c.y += wellPath[i].y;
                let r = wellPath[i].x;

                template.miniatureShapes.push(MiniatureShape.MakeNGon(
                    c,
                    r,
                    BABYLON.Axis.Y,
                    24,
                    false
                ));
            }

            return template;
        }
    }
}
