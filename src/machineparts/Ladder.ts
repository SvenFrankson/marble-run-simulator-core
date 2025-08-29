namespace MarbleRunSimulatorCore {
    export class Ladder extends MachinePart {

        private static _WallThickness: number = 0.005;
        private static _WallDepth: number = 0.02;
        private static _Drop: number = 0.01;
        
        public leftWall: BABYLON.Mesh;
        public leftWallH: number;
        public rightWall: BABYLON.Mesh;
        public rightWallH: number;

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);
            this.setColorCount(3);
            this.setTemplate(this.machine.templateManager.getTemplate(Ladder.PropToPartName(prop)));

            let x0 = - tileSize * 0.5;
            let x1 = - tileSize * 0.5 + prop.l * tileSize;

            let leftYMax = - tileHeight;
            let leftYMin = - prop.h * tileHeight + Ladder._Drop - 0.005;
            this.leftWallH = leftYMax - leftYMin;

            let rightYMax = 0;
            let rightYMin = -prop.h * tileHeight + tileHeight + Ladder._Drop - 0.005;
            this.rightWallH = rightYMax - rightYMin;

            this.leftWall = new BABYLON.Mesh("left-ladder-wall");
            this.leftWall.position.x = x0 + 0.5 * Ladder._WallThickness;
            this.leftWall.position.y = (leftYMax + leftYMin) * 0.5;
            this.leftWall.parent = this;

            this.rightWall = new BABYLON.Mesh("left-ladder-wall");
            this.rightWall.position.x = x1 - 0.5 * Ladder._WallThickness;
            this.rightWall.position.y = (rightYMax + rightYMin) * 0.5;
            this.rightWall.parent = this;

            let leftCollider = new Mummu.BoxCollider(this.leftWall._worldMatrix);
            leftCollider.width = Ladder._WallThickness;
            leftCollider.height = this.leftWallH;
            leftCollider.depth = Ladder._WallDepth;

            let leftMachineCollider = new MachineCollider(leftCollider);
            
            let rightCollider = new Mummu.BoxCollider(this.rightWall._worldMatrix);
            rightCollider.width = Ladder._WallThickness;
            rightCollider.height = this.rightWallH;
            rightCollider.depth = Ladder._WallDepth;
            
            let rightMachineCollider = new MachineCollider(rightCollider);

            this.colliders = [leftMachineCollider, rightMachineCollider];

            this.generateWires();
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            let partName = "ladder_" + prop.l.toFixed(0) + "." + prop.h.toFixed(0);
            return partName;
        }

        protected async instantiateMachineSpecific(): Promise<void> {
            Mummu.CreateBeveledBoxVertexData({ width: Ladder._WallThickness, height: this.leftWallH, depth: Ladder._WallDepth }).applyToMesh(this.leftWall);
            Mummu.CreateBeveledBoxVertexData({ width: Ladder._WallThickness, height: this.rightWallH, depth: Ladder._WallDepth }).applyToMesh(this.rightWall);
            
            this.leftWall.material = this.game.materials.getMaterial(this.getColor(2), this.machine.materialQ);
            this.rightWall.material = this.game.materials.getMaterial(this.getColor(2), this.machine.materialQ);

            let type = this.game.materials.getMaterialType(this.getColor(2));
            let surface = Surface.Rail;
            if (type === MaterialType.Metal) {
                surface = Surface.Metal;
            }
            else {
                surface = Surface.Plastic;
            }
            this.colliders[0].getSurface = () => {
                return surface;
            }
            this.colliders[1].getSurface = () => {
                return surface;
            }
        }

        public static GenerateTemplate(l: number, h: number): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "ladder_" + l.toFixed(0) + "." + h.toFixed(0);
            template.l = l;
            template.h = h;

            template.lExtendableOnX = true;
            template.minLAbsolute = 1;
            template.minL = 2;
            template.maxL = 8;
            template.hExtendableOnY = true;
            template.minH = 2;
            template.downwardYExtendable = true;

            template.nExtendable = true;

            let x0 = - tileSize * 0.5;
            let x1 = - tileSize * 0.5 + l * tileSize;
            let hole = 0.016;
            
            let count: number;
            if (h % 2 === 0) {
                count = h - 1;
            }
            else {
                count = h - 2;
            }
            let dy = (h * tileSize - Ladder._Drop) / (count + 1);
            let angleDrop = Math.atan(Ladder._Drop / ((x1 - x0) / 6)) / Math.PI * 180 + 90;

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x0, 0, 0), Tools.V3Dir(90)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x1 - Ladder._WallThickness - hole, - Ladder._Drop, 0), Tools.V3Dir(90)),
            ];
            template.trackTemplates[0].colorIndex = 0;
            template.trackTemplates[1] = new TrackTemplate(template);
            template.trackTemplates[1].trackpoints = [
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x0 + Ladder._WallThickness, - h * tileHeight + Ladder._Drop, 0), Tools.V3Dir(angleDrop)),
                new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(x1, - h * tileHeight, 0), Tools.V3Dir(90)),
            ];
            template.trackTemplates[1].colorIndex = 1;

            for (let n = 0; n < count; n++) {
                if (n % 2 === 0) {
                    let trackTemplate = new TrackTemplate(template);
                    trackTemplate.trackpoints = [
                        new TrackPoint(trackTemplate, new BABYLON.Vector3(x1 - Ladder._WallThickness + 0.002, 0 - dy * (n + 1), 0), Tools.V3Dir(- angleDrop)),
                        new TrackPoint(trackTemplate, new BABYLON.Vector3(x0 + Ladder._WallThickness + hole, 0 - dy * (n + 1) - Ladder._Drop, 0), Tools.V3Dir(- 90)),
                    ];
                    trackTemplate.colorIndex = 1;
                    template.trackTemplates.push(trackTemplate);
                }
                else {
                    let trackTemplate = new TrackTemplate(template);
                    trackTemplate.trackpoints = [
                        new TrackPoint(trackTemplate, new BABYLON.Vector3(x0 + Ladder._WallThickness - 0.002, 0 - dy * (n + 1), 0), Tools.V3Dir(angleDrop)),
                        new TrackPoint(trackTemplate, new BABYLON.Vector3(x1 - Ladder._WallThickness - hole, 0 - dy * (n + 1) - Ladder._Drop, 0), Tools.V3Dir(90)),
                    ];
                    trackTemplate.colorIndex = 0;
                    template.trackTemplates.push(trackTemplate);
                }
            }

            template.initialize();

            return template;
        }
    }
}
