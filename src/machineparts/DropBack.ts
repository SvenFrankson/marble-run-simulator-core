namespace MarbleRunSimulatorCore {
    
    export class DropBack extends MachinePart {

        public shieldConnector: BABYLON.Mesh;

        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);
            this.setColorCount(2);

            this.setTemplate(this.machine.templateManager.getTemplate(DropBack.PropToPartName(prop)));

            let rShield = 0.0095;
            let hShield = 0.008;

            let shieldWire = new Wire(this);
            shieldWire.colorIndex = 0;
            shieldWire.path = [];

            for (let i = 4; i < 29; i++) {
                let a = i / 32 * 2 * Math.PI;
                if (i === 4) {
                    a = 4.4 / 32 * 2 * Math.PI;
                }
                if (i === 28) {
                    a = 27.6 / 32 * 2 * Math.PI;
                }
                let x = - Math.cos(a) * rShield;
                let z = Math.sin(a) * rShield;
                shieldWire.path.push(new BABYLON.Vector3(x, 0, z));
            }
            this.wires.push(shieldWire);

            let upperShieldWire = new Wire(this);
            upperShieldWire.colorIndex = 0;
            upperShieldWire.path = [];

            for (let i = 7; i < 26; i++) {
                let a = i / 32 * 2 * Math.PI; 
                let x = - Math.cos(a) * rShield;
                let z = Math.sin(a) * rShield;
                upperShieldWire.path.push(new BABYLON.Vector3(x, hShield, z));
            }
            this.wires.push(upperShieldWire);

            let vData0 = BABYLON.CreateCylinderVertexData({ height: hShield, diameter: 0.0015, tessellation: 4 });
            let vDatas = [
                Mummu.TranslateVertexDataInPlace(Mummu.CloneVertexData(vData0), new BABYLON.Vector3(0, 0.5 * hShield, rShield)),
                Mummu.TranslateVertexDataInPlace(Mummu.CloneVertexData(vData0), new BABYLON.Vector3(rShield, 0.5 * hShield, 0)),
                Mummu.TranslateVertexDataInPlace(Mummu.CloneVertexData(vData0), new BABYLON.Vector3(0, 0.5 * hShield, - rShield))
            ];
            this.shieldConnector = new BABYLON.Mesh("shield-connector");
            this.shieldConnector.parent = this;
            Mummu.MergeVertexDatas(...vDatas).applyToMesh(this.shieldConnector);

            this.generateWires();
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            let partName = "dropback_" + prop.h.toFixed(0);
            return partName;
        }
        
        protected async instantiateMachineSpecific(): Promise<void> {
            this.shieldConnector.material = this.game.materials.getMaterial(this.getColor(0), this.machine.materialQ);
        }

        public static GenerateTemplate(h: number): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "dropback_" + h.toFixed(0);

            template.h = h;
            template.hExtendableOnY = true;
            template.downwardYExtendable = true;
            template.minH = 1;
            template.maxH = 4;

            let r = 0.009;

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].colorIndex = 0;
            template.trackTemplates[0].trackpoints = [
                new TrackPoint(
                    template.trackTemplates[0],
                    new BABYLON.Vector3(- tileSize * 0.5, 0, 0),
                    new BABYLON.Vector3(1, 0, 0)
                ),
                new TrackPoint(
                    template.trackTemplates[0],
                    new BABYLON.Vector3(- r + 0.002, 0, 0),
                    new BABYLON.Vector3(1, 0, 0)
                )
            ];


            template.trackTemplates[1] = new TrackTemplate(template);
            template.trackTemplates[1].colorIndex = 1;
            template.trackTemplates[1].trackpoints = [
                new TrackPoint(
                    template.trackTemplates[1],
                    new BABYLON.Vector3(r, - tileHeight * template.h + 0.004, 0),
                    (new BABYLON.Vector3(-1, -0.4, 0)).normalize()
                ),
                new TrackPoint(
                    template.trackTemplates[1],
                    new BABYLON.Vector3(- tileSize * 0.5, - tileHeight * template.h, 0),
                    new BABYLON.Vector3(-1, 0, 0)
                )
            ];
            template.trackTemplates[1].drawStartTip = true;

            template.maxAngle = 0;
            template.defaultAngle = 0;

            template.initialize();

            return template;
        }

        public onBeforeApplyingSelectorMeshLogicVertexData(selectorMeshLogicVertexDatas: BABYLON.VertexData[]): void {
            let stairsSelector = BABYLON.CreateBoxVertexData({ width: 0.018, height: 0.018, depth: 0.018 });
            selectorMeshLogicVertexDatas.push(stairsSelector);
        }
    }
}
