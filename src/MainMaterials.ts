namespace MarbleRunSimulatorCore {
    export class MainMaterials {
        private _metalMaterialsPBR: BABYLON.Material[] = [];
        private _metalMaterialsSTD: BABYLON.Material[] = [];
        public getMetalMaterial(colorIndex: number, graphicQ: number = -1): BABYLON.Material {
            if (graphicQ === -1) {
                graphicQ = this.game.getGraphicQ();
            }

            if (graphicQ === 0) {
                return this._metalMaterialsSTD[colorIndex % this._metalMaterialsSTD.length];
            }
            return this._metalMaterialsPBR[colorIndex % this._metalMaterialsPBR.length];
        }
        public get metalMaterialsCount(): number {
            return Math.min(this._metalMaterialsPBR.length, this._metalMaterialsSTD.length);
        }

        private _ballMaterialsPBR: BABYLON.Material[] = [];
        private _ballMaterialsSTD: BABYLON.Material[] = [];
        public getBallMaterial(colorIndex: number, graphicQ: number = - 1): BABYLON.Material {
            if (graphicQ === -1) {
                graphicQ = this.game.getGraphicQ();
            }

            if (graphicQ === 0) {
                return this._ballMaterialsSTD[colorIndex % this._ballMaterialsSTD.length];
            }
            return this._ballMaterialsPBR[colorIndex % this._ballMaterialsPBR.length];
        }
        public get ballMaterialsCount(): number {
            return Math.min(this._ballMaterialsPBR.length, this._ballMaterialsSTD.length);
        }

        public velvetMaterial: BABYLON.StandardMaterial;
        public logoMaterial: BABYLON.StandardMaterial;
        public baseAxisMaterial: BABYLON.StandardMaterial;
        public whiteMaterial: BABYLON.StandardMaterial;
        public paintingLight: BABYLON.StandardMaterial;
        public handleMaterial: BABYLON.StandardMaterial;
        public ghostMaterial: BABYLON.StandardMaterial;
        public gridMaterial: BABYLON.StandardMaterial;
        public cyanMaterial: BABYLON.StandardMaterial;
        public redMaterial: BABYLON.StandardMaterial;
        public greenMaterial: BABYLON.StandardMaterial;
        public blueMaterial: BABYLON.StandardMaterial;
        public whiteAutolitMaterial: BABYLON.StandardMaterial;
        public whiteFullLitMaterial: BABYLON.StandardMaterial;
        public plasticBlack: BABYLON.StandardMaterial;

        constructor(public game: IGame) {
            let envTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("./lib/marble-run-simulator-core/datas/environment/environmentSpecular.env", this.game.scene);

            this.handleMaterial = new BABYLON.StandardMaterial("handle-material");
            this.handleMaterial.diffuseColor.copyFromFloats(0, 0, 0);
            this.handleMaterial.specularColor.copyFromFloats(0, 0, 0);
            this.handleMaterial.alpha = 1;

            this.ghostMaterial = new BABYLON.StandardMaterial("ghost-material");
            this.ghostMaterial.diffuseColor.copyFromFloats(0.8, 0.8, 1);
            this.ghostMaterial.specularColor.copyFromFloats(0, 0, 0);
            this.ghostMaterial.alpha = 0.3;

            this.gridMaterial = new BABYLON.StandardMaterial("grid-material");
            this.gridMaterial.diffuseColor.copyFromFloats(0, 0, 0);
            this.gridMaterial.specularColor.copyFromFloats(0, 0, 0);
            //this.gridMaterial.alpha = this.game.config.getValue("gridOpacity");

            this.cyanMaterial = new BABYLON.StandardMaterial("cyan-material");
            this.cyanMaterial.diffuseColor = BABYLON.Color3.FromHexString("#00FFFF");
            this.cyanMaterial.specularColor.copyFromFloats(0, 0, 0);

            this.redMaterial = new BABYLON.StandardMaterial("red-material");
            this.redMaterial.diffuseColor = BABYLON.Color3.FromHexString("#bf212f");
            this.redMaterial.emissiveColor = BABYLON.Color3.FromHexString("#bf212f");
            this.redMaterial.specularColor.copyFromFloats(0, 0, 0);

            this.greenMaterial = new BABYLON.StandardMaterial("green-material");
            this.greenMaterial.diffuseColor = BABYLON.Color3.FromHexString("#006f3c");
            this.greenMaterial.emissiveColor = BABYLON.Color3.FromHexString("#006f3c");
            this.greenMaterial.specularColor.copyFromFloats(0, 0, 0);

            this.blueMaterial = new BABYLON.StandardMaterial("blue-material");
            this.blueMaterial.diffuseColor = BABYLON.Color3.FromHexString("#264b96");
            this.blueMaterial.emissiveColor = BABYLON.Color3.FromHexString("#264b96");
            this.blueMaterial.specularColor.copyFromFloats(0, 0, 0);

            this.whiteAutolitMaterial = new BABYLON.StandardMaterial("white-autolit-material");
            this.whiteAutolitMaterial.diffuseColor = BABYLON.Color3.FromHexString("#baccc8");
            this.whiteAutolitMaterial.emissiveColor = BABYLON.Color3.FromHexString("#baccc8").scaleInPlace(0.5);
            this.whiteAutolitMaterial.specularColor.copyFromFloats(0, 0, 0);

            this.whiteFullLitMaterial = new BABYLON.StandardMaterial("white-autolit-material");
            this.whiteFullLitMaterial.diffuseColor = BABYLON.Color3.FromHexString("#baccc8");
            this.whiteFullLitMaterial.emissiveColor = BABYLON.Color3.FromHexString("#baccc8");
            this.whiteFullLitMaterial.specularColor.copyFromFloats(0, 0, 0);

            let steelMaterialPBR = new BABYLON.PBRMetallicRoughnessMaterial("steel-pbr", this.game.scene);
            steelMaterialPBR.baseColor = new BABYLON.Color3(0.5, 0.75, 1.0);
            steelMaterialPBR.metallic = 1.0;
            steelMaterialPBR.roughness = 0.15;
            steelMaterialPBR.environmentTexture = envTexture;
            
            let steelMaterialSTD = new BABYLON.StandardMaterial("steel-std", this.game.scene);
            steelMaterialSTD.diffuseColor = new BABYLON.Color3(0.5, 0.75, 1.0);
            steelMaterialSTD.specularColor = new BABYLON.Color3(1, 1, 1);
            steelMaterialSTD.emissiveColor = steelMaterialSTD.diffuseColor.scale(0.5);
            steelMaterialSTD.roughness = 0.15;

            let copperMaterialPBR = new BABYLON.PBRMetallicRoughnessMaterial("pbr", this.game.scene);
            copperMaterialPBR.baseColor = BABYLON.Color3.FromHexString("#B87333");
            copperMaterialPBR.metallic = 1.0;
            copperMaterialPBR.roughness = 0.15;
            copperMaterialPBR.environmentTexture = envTexture;
            
            let copperMaterialSTD = new BABYLON.StandardMaterial("copper-std", this.game.scene);
            copperMaterialSTD.diffuseColor = BABYLON.Color3.FromHexString("#B87333");
            copperMaterialSTD.specularColor = new BABYLON.Color3(1, 1, 1);
            copperMaterialSTD.emissiveColor = copperMaterialSTD.diffuseColor.scale(0.5);
            copperMaterialSTD.roughness = 0.15;
            
            let blackSteelMaterialPBR = new BABYLON.PBRMetallicRoughnessMaterial("steel-pbr", this.game.scene);
            blackSteelMaterialPBR.baseColor = new BABYLON.Color3(0.05, 0.04, 0.045);
            blackSteelMaterialPBR.metallic = 0.85;
            blackSteelMaterialPBR.roughness = 0.15;
            blackSteelMaterialPBR.environmentTexture = envTexture;
            
            let blackSteelMaterialSTD = new BABYLON.StandardMaterial("steel-std", this.game.scene);
            blackSteelMaterialSTD.diffuseColor = new BABYLON.Color3(0.1, 0.15, 0.2);
            blackSteelMaterialSTD.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
            blackSteelMaterialSTD.emissiveColor = blackSteelMaterialSTD.diffuseColor.scale(0.5);
            blackSteelMaterialSTD.roughness = 0.25;
            
            let redSteelMaterialPBR = new BABYLON.PBRMetallicRoughnessMaterial("red-steel-pbr", this.game.scene);
            redSteelMaterialPBR.baseColor = new BABYLON.Color3(0.1, 0, 0);
            redSteelMaterialPBR.metallic = 0.85;
            redSteelMaterialPBR.roughness = 0.2;
            redSteelMaterialPBR.environmentTexture = envTexture;
            
            let redSteelMaterialSTD = new BABYLON.StandardMaterial("red-steel-std", this.game.scene);
            redSteelMaterialSTD.diffuseColor = new BABYLON.Color3(0.1, 0.15, 0.2);
            redSteelMaterialSTD.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
            redSteelMaterialSTD.emissiveColor = redSteelMaterialSTD.diffuseColor.scale(0.5);
            redSteelMaterialSTD.roughness = 0.25;

            this.plasticBlack = new BABYLON.StandardMaterial("plastic-black", this.game.scene);
            this.plasticBlack.diffuseColor = BABYLON.Color3.FromHexString("#282a33");
            this.plasticBlack.specularColor.copyFromFloats(0.1, 0.1, 0.1);
            this.plasticBlack.emissiveColor.copyFromFloats(0.1, 0.1, 0.1);

            let plasticIndigo = new BABYLON.PBRMetallicRoughnessMaterial("pbr", this.game.scene);
            plasticIndigo.baseColor = BABYLON.Color3.FromHexString("#004777");
            plasticIndigo.metallic = 0;
            plasticIndigo.roughness = 0.9;
            plasticIndigo.environmentTexture = envTexture;

            let plasticRed = new BABYLON.PBRMetallicRoughnessMaterial("pbr", this.game.scene);
            plasticRed.baseColor = BABYLON.Color3.FromHexString("#A30000");
            plasticRed.metallic = 0;
            plasticRed.roughness = 0.9;
            plasticRed.environmentTexture = envTexture;
            
            let plasticOrange = new BABYLON.PBRMetallicRoughnessMaterial("pbr", this.game.scene);
            plasticOrange.baseColor = BABYLON.Color3.FromHexString("#FF7700");
            plasticOrange.metallic = 0;
            plasticOrange.roughness = 0.9;
            plasticOrange.environmentTexture = envTexture;

            let plasticYellow = new BABYLON.PBRMetallicRoughnessMaterial("pbr", this.game.scene);
            plasticYellow.baseColor = BABYLON.Color3.FromHexString("#EFD28D");
            plasticYellow.metallic = 0;
            plasticYellow.roughness = 0.9;
            plasticYellow.environmentTexture = envTexture;

            let plasticGreen = new BABYLON.PBRMetallicRoughnessMaterial("pbr", this.game.scene);
            plasticGreen.baseColor = BABYLON.Color3.FromHexString("#00AFB5");
            plasticGreen.metallic = 0;
            plasticGreen.roughness = 0.9;
            plasticGreen.environmentTexture = envTexture;

            this._metalMaterialsPBR = [steelMaterialPBR, copperMaterialPBR, blackSteelMaterialPBR, redSteelMaterialPBR, this.plasticBlack];
            this._metalMaterialsSTD = [steelMaterialSTD, copperMaterialSTD, blackSteelMaterialSTD, redSteelMaterialSTD, this.plasticBlack];

            this.velvetMaterial = new BABYLON.StandardMaterial("velvet-material");
            this.velvetMaterial.diffuseColor.copyFromFloats(0.75, 0.75, 0.75);
            this.velvetMaterial.diffuseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/velvet.jpg");
            this.velvetMaterial.specularColor.copyFromFloats(0, 0, 0);

            this.logoMaterial = new BABYLON.StandardMaterial("logo-material");
            this.logoMaterial.diffuseColor.copyFromFloats(1, 1, 1);
            this.logoMaterial.diffuseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/logo-white-no-bg.png");
            this.logoMaterial.diffuseTexture.hasAlpha = true;
            this.logoMaterial.useAlphaFromDiffuseTexture = true;
            this.logoMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);
            this.logoMaterial.alpha = 0.3;

            this.baseAxisMaterial = new BABYLON.StandardMaterial("logo-material");
            this.baseAxisMaterial.diffuseColor.copyFromFloats(1, 1, 1);
            this.baseAxisMaterial.diffuseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/axis.png");
            this.baseAxisMaterial.diffuseTexture.hasAlpha = true;
            this.baseAxisMaterial.useAlphaFromDiffuseTexture = true;
            this.baseAxisMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);

            this.whiteMaterial = new BABYLON.StandardMaterial("white-material");
            this.whiteMaterial.diffuseColor.copyFromFloats(0.9, 0.95, 1).scaleInPlace(0.9);
            this.whiteMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);

            this.paintingLight = new BABYLON.StandardMaterial("autolit-material");
            this.paintingLight.diffuseColor.copyFromFloats(1, 1, 1);
            this.paintingLight.emissiveTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/painting-light.png");
            this.paintingLight.specularColor.copyFromFloats(0.1, 0.1, 0.1);

            /*
            let makeMetalBallMaterial = (name: string, textureName: string) => {
                let ballMaterial = new BABYLON.PBRMetallicRoughnessMaterial(name, this.game.scene);
                ballMaterial.metallic = 1;
                ballMaterial.roughness = 0.15;
                ballMaterial.environmentTexture = envTexture;
                ballMaterial.baseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/" + textureName, undefined, undefined, false);

                return ballMaterial;
            }
            */

            let makeBrandedBallMaterialSTD = (name: string, textureName: string) => {
                let ballMaterial = new BABYLON.StandardMaterial(name, this.game.scene);
                ballMaterial.specularColor = new BABYLON.Color3(0.7, 0.7, 0.7);
                ballMaterial.roughness = 0.3;
                ballMaterial.diffuseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/" + textureName, undefined, undefined, false);
                ballMaterial.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.3);

                return ballMaterial;
            }

            let makeBrandedBallMaterialPBR = (name: string, textureName: string) => {
                let ballMaterial = new BABYLON.PBRMetallicRoughnessMaterial(name, this.game.scene);
                ballMaterial.baseColor = BABYLON.Color3.FromHexString("#FFFFFF");
                ballMaterial.metallic = 0.7;
                ballMaterial.roughness = 0.3;
                ballMaterial.environmentTexture = envTexture;
                ballMaterial.baseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/" + textureName, undefined, undefined, false);

                return ballMaterial;
            }

            this._ballMaterialsPBR = [
                this._metalMaterialsPBR[0],
                this._metalMaterialsPBR[1],
                makeBrandedBallMaterialPBR("square-red", "ball-square-red.png"),
                makeBrandedBallMaterialPBR("circle-green", "ball-circle-green.png"),
                makeBrandedBallMaterialPBR("star-blue", "ball-star-blue.png"),
                makeBrandedBallMaterialPBR("tiaratum", "ball-tiaratum.png"),
                makeBrandedBallMaterialPBR("html5", "ball-html5.png"),
                makeBrandedBallMaterialPBR("tiaratum", "ball-bjs.png"),
                makeBrandedBallMaterialPBR("html5", "ball-poki.png")
            ]

            this._ballMaterialsSTD = [
                this._metalMaterialsSTD[0],
                this._metalMaterialsSTD[1],
                makeBrandedBallMaterialSTD("square-red", "ball-square-red.png"),
                makeBrandedBallMaterialSTD("circle-green", "ball-circle-green.png"),
                makeBrandedBallMaterialSTD("star-blue", "ball-star-blue.png"),
                makeBrandedBallMaterialSTD("tiaratum", "ball-tiaratum.png"),
                makeBrandedBallMaterialSTD("html5", "ball-html5.png"),
                makeBrandedBallMaterialSTD("tiaratum", "ball-bjs.png"),
                makeBrandedBallMaterialSTD("html5", "ball-poki.png")
            ]
        }
    }
}
