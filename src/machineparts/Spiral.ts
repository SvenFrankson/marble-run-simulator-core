/// <reference path="../machine/MachinePart.ts"/>

namespace MarbleRunSimulatorCore {
    export class Spiral extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);
            this.setColorCount(1);

            this.setTemplate(this.machine.templateManager.getTemplate(Spiral.PropToPartName(prop), prop.mirrorX, prop.mirrorZ));
            this.generateWires();
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            return "spiral_" + prop.l.toFixed(0) + "." + prop.h.toFixed(0);
        }

        public static GenerateTemplate(l: number, h: number): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "spiral_" + l.toFixed(0) + "." + h.toFixed(0);

            template.l = l;
            template.h = h;
            template.n = h;

            template.lExtendableOnX = true;
            template.minLAbsolute = 1;
            template.minL = -32;
            template.maxL = 32;
            template.hExtendableOnY = true;
            template.minH = 1;
            template.downwardYExtendable = true;
            
            template.defaultAngle = Math.PI / 6;
            template.maxAngle = Math.PI / 3;

            let x0 = - tileSize * 0.5;
            let x1 = tileSize * (template.l - 0.5);
            if (template.l < 0) {
                x0 = tileSize * (Math.abs(template.l) - 0.5);
                x1 = - tileSize * 0.5;
            }

            template.trackTemplates[0] = new TrackTemplate(template);
            //template.trackTemplates[0].preferedStartBank = - Math.PI / 10 * (template.mirrorX ? - 1 : 1);
            //template.trackTemplates[0].preferedEndBank = - Math.PI / 10 * (template.mirrorX ? - 1 : 1);
            template.trackTemplates[0].onNormalEvaluated = (n) => {
                n.copyFromFloats(0, 1, 0);
            };
            template.trackTemplates[0].trackpoints = [new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x0, 0, 0), Tools.V3Dir(template.l > 0 ? 90 : -90))];

            let nSpirals = template.n;
            let widthInM = Math.abs(template.l) * tileSize;
            let r = Math.abs(widthInM * 0.5 - 0.01);
            let heightStart = 0 - 0.003;
            let heightEnd = - tileHeight * template.h + 0.003;
            let x = (x0 + x1) * 0.5;

            for (let nS = 0; nS < nSpirals; nS++) {

                let nV0 = 0;
                if (nS >= 1) {
                    nV0 = 1;
                }
                for (let nV = nV0; nV <= 8; nV++) {
                    let f = ((nS * 8) + nV) / (nSpirals * 8);
                    let a = Math.sign(template.l) * (2 * Math.PI * nV) / 8;
                    let cosa = Math.cos(a);
                    let sina = Math.sin(a);

                    let dir: BABYLON.Vector3;
                    if (nV === 0 || ((nV === 8) && (nS === nSpirals - 1))) {
                        //dir = BABYLON.Vector3.Right();
                    }
                    
                    let absZ = - r * (1 - cosa) - 0.0008 * Math.abs(template.l);
                    template.trackTemplates[0].trackpoints.push(
                        new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x + sina * r, f * (heightEnd - heightStart) + heightStart, absZ), dir)
                    );
                }
            }

            template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x1, - tileHeight * template.h, 0), Tools.V3Dir(template.l > 0 ? 90 : -90)));

            template.initialize();

            return template;
        }
    }
}
