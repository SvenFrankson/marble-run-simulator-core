/// <reference path="../machine/MachinePart.ts"/>

namespace MarbleRunSimulatorCore {
    export class Spiral extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            prop.l = Nabu.MinMax(prop.l, 3, 32);

            this.setTemplate(this.machine.templateManager.getTemplate(Spiral.PropToPartName(prop), prop.mirrorX, prop.mirrorZ));
            this.generateWires();
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            return "spiral_" + prop.l.toFixed(0) + "." + prop.h.toFixed(0);
        }

        public static GenerateTemplate(w: number, h: number, mirrorX: boolean, mirrorZ: boolean): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "spiral_" + w.toFixed(0) + "." + h.toFixed(0);

            template.l = w;
            template.h = h;
            template.n = h;
            template.mirrorX = mirrorX;
            template.mirrorZ = mirrorZ;

            template.lExtendableOnX = true;
            template.hExtendableOnY = true;
            template.downwardYExtendable = true;
            template.xMirrorable = true;
            
            template.defaultAngle = Math.PI / 6;
            template.maxAngle = Math.PI / 3;

            template.trackTemplates[0] = new TrackTemplate(template);
            //template.trackTemplates[0].preferedStartBank = - Math.PI / 10 * (template.mirrorX ? - 1 : 1);
            //template.trackTemplates[0].preferedEndBank = - Math.PI / 10 * (template.mirrorX ? - 1 : 1);
            template.trackTemplates[0].onNormalEvaluated = (n) => {
                n.copyFromFloats(0, 1, 0);
            };
            template.trackTemplates[0].trackpoints = [new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileSize * 0.5, 0, 0), Tools.V3Dir(90))];

            let nSpirals = template.n;
            let widthInM = template.l * tileSize;
            let r = widthInM * 0.5 - 0.01;
            let heightStart = 0 - 0.003;
            let heightEnd = - tileHeight * template.h + 0.003;
            let x = - tileSize * 0.5 + template.l * tileSize * 0.5;

            for (let nS = 0; nS < nSpirals; nS++) {

                let nV0 = 0;
                if (nS >= 1) {
                    nV0 = 1;
                }
                for (let nV = nV0; nV <= 8; nV++) {
                    let f = ((nS * 8) + nV) / (nSpirals * 8);
                    let a = (2 * Math.PI * nV) / 8;
                    let cosa = Math.cos(a);
                    let sina = Math.sin(a);

                    let dir: BABYLON.Vector3;
                    if (nV === 0 || ((nV === 8) && (nS === nSpirals - 1))) {
                        //dir = BABYLON.Vector3.Right();
                    }
                    
                    template.trackTemplates[0].trackpoints.push(
                        new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x + sina * r, f * (heightEnd - heightStart) + heightStart, - r + cosa * r - 0.0008 * template.l), dir)
                    );
                }
            }

            template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(tileSize * (template.l - 0.5), - tileHeight * template.h, 0), Tools.V3Dir(90)));

            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }
            if (mirrorZ) {
                template.mirrorZTrackPointsInPlace();
            }

            template.initialize();

            return template;
        }
    }
}
