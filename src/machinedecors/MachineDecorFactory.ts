namespace MarbleRunSimulatorCore {

    export abstract class MachineDecorFactory {
        
        constructor(public machine: Machine) {}

        public createDecor(name: string): MachineDecor {
            if (name === "xylophone") {
                return new Xylophone(this.machine);
            }
        }
    }
}