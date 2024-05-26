namespace MarbleRunSimulatorCore {
    export class MainMaterials {
        private _materialsPBR: BABYLON.Material[] = [];
        private _materialsSTD: BABYLON.Material[] = [];
        public getMaterial(colorIndex: number, materialQ: number = -1): BABYLON.Material {
            if (materialQ === -1) {
                materialQ = this.game.getMaterialQ();
            }

            if (materialQ === MaterialQuality.PBR) {
                return this._materialsPBR[colorIndex % this._materialsPBR.length];
            }
            return this._materialsSTD[colorIndex % this._materialsSTD.length];
        }
        public get metalMaterialsCount(): number {
            return Math.min(this._materialsPBR.length, this._materialsSTD.length);
        }

        private _ballMaterialsPBR: BABYLON.Material[] = [];
        private _ballMaterialsSTD: BABYLON.Material[] = [];
        public getBallMaterial(colorIndex: number, materialQ: number = - 1): BABYLON.Material {
            if (materialQ === -1) {
                materialQ = this.game.getMaterialQ();
            }

            if (materialQ === MaterialQuality.PBR) {
                return this._ballMaterialsPBR[colorIndex % this._ballMaterialsPBR.length];
            }
            return this._ballMaterialsSTD[colorIndex % this._ballMaterialsSTD.length];
        }
        public get ballMaterialsCount(): number {
            return Math.min(this._ballMaterialsPBR.length, this._ballMaterialsSTD.length);
        }

        private _wallpapers: BABYLON.Material[] = [];
        public getWallpaperMaterial(index: number): BABYLON.Material {
            return this._wallpapers[index];
        }

        public velvetMaterial: BABYLON.StandardMaterial;
        public logoMaterial: BABYLON.StandardMaterial;
        public baseAxisMaterial: BABYLON.StandardMaterial;
        public whiteMaterial: BABYLON.StandardMaterial;
        public paintingLight: BABYLON.StandardMaterial;
        public wallShadow: BABYLON.StandardMaterial;
        public groundMaterial: BABYLON.StandardMaterial;
        public handleMaterial: BABYLON.StandardMaterial;
        public ghostMaterial: BABYLON.StandardMaterial;
        public gridMaterial: BABYLON.StandardMaterial;
        public cyanMaterial: BABYLON.StandardMaterial;
        public redMaterial: BABYLON.StandardMaterial;
        public greenMaterial: BABYLON.StandardMaterial;
        public blueMaterial: BABYLON.StandardMaterial;
        public whiteAutolitMaterial: BABYLON.StandardMaterial;
        public whiteFullLitMaterial: BABYLON.StandardMaterial;
        public get plasticBlack() {
            return this.getMaterial(6);
        }

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

            this._generateMaterials(envTexture);

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

            this.wallShadow = new BABYLON.StandardMaterial("autolit-material");
            this.wallShadow.ambientTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/wall-shadow.png");
            this.wallShadow.specularColor.copyFromFloats(0.1, 0.1, 0.1);
            this.wallShadow.emissiveColor.copyFromFloats(0.2, 0.2, 0.2);

            this.groundMaterial = new BABYLON.StandardMaterial("ground-material");
            this.groundMaterial.diffuseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/concrete.png");
            this.groundMaterial.diffuseColor = BABYLON.Color3.FromHexString("#3f4c52");
            this.groundMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);

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
                this._materialsPBR[0],
                this._materialsPBR[1],
                makeBrandedBallMaterialPBR("square-red", "ball-square-red.png"),
                makeBrandedBallMaterialPBR("circle-green", "ball-circle-green.png"),
                makeBrandedBallMaterialPBR("star-blue", "ball-star-blue.png"),
                makeBrandedBallMaterialPBR("tiaratum", "ball-tiaratum.png"),
                makeBrandedBallMaterialPBR("html5", "ball-html5.png"),
                makeBrandedBallMaterialPBR("tiaratum", "ball-bjs.png"),
                makeBrandedBallMaterialPBR("html5", "ball-poki.png")
            ]

            this._ballMaterialsSTD = [
                this._materialsSTD[0],
                this._materialsSTD[1],
                makeBrandedBallMaterialSTD("square-red", "ball-square-red.png"),
                makeBrandedBallMaterialSTD("circle-green", "ball-circle-green.png"),
                makeBrandedBallMaterialSTD("star-blue", "ball-star-blue.png"),
                makeBrandedBallMaterialSTD("tiaratum", "ball-tiaratum.png"),
                makeBrandedBallMaterialSTD("html5", "ball-html5.png"),
                makeBrandedBallMaterialSTD("tiaratum", "ball-bjs.png"),
                makeBrandedBallMaterialSTD("html5", "ball-poki.png")
            ]

            this._wallpapers = [];

            let abstractBubblesMaterial = new BABYLON.StandardMaterial("abstract-bubbles-material");
            abstractBubblesMaterial.diffuseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/wallpapers/abstract-bubbles.png");
            abstractBubblesMaterial.ambientTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/wall-shadow.png");
            abstractBubblesMaterial.ambientTexture.coordinatesIndex = 1;
            abstractBubblesMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);
            abstractBubblesMaterial.emissiveColor.copyFromFloats(0.2, 0.2, 0.2);
            this._wallpapers[0] = abstractBubblesMaterial;
            

            let abstractSquaresMaterial = new BABYLON.StandardMaterial("abstract-squares-material");
            abstractSquaresMaterial.diffuseTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/wallpapers/abstract-squares.png");
            abstractSquaresMaterial.ambientTexture = new BABYLON.Texture("./lib/marble-run-simulator-core/datas/textures/wall-shadow.png");
            abstractSquaresMaterial.ambientTexture.coordinatesIndex = 1;
            abstractSquaresMaterial.specularColor.copyFromFloats(0.1, 0.1, 0.1);
            abstractSquaresMaterial.emissiveColor.copyFromFloats(0.2, 0.2, 0.2);
            this._wallpapers[1] = abstractSquaresMaterial;
        }

        private _makePlasticPBR(name: string, color: BABYLON.Color3, envTexture: BABYLON.CubeTexture): BABYLON.Material {
            let plastic = new BABYLON.PBRMetallicRoughnessMaterial(name, this.game.scene);
            plastic.baseColor = color;
            plastic.roughness = 1;
            plastic.environmentTexture = envTexture;

            return plastic;
        }

        private _makePlasticSTD(name: string, color: BABYLON.Color3): BABYLON.StandardMaterial {
            let plastic = new BABYLON.StandardMaterial(name, this.game.scene);
            plastic.diffuseColor = color;
            plastic.emissiveColor = plastic.diffuseColor.scale(0.4).add(new BABYLON.Color3(0.1, 0.1, 0.1));
            plastic.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);

            return plastic;
        }

        private _generateMaterials(envTexture: BABYLON.CubeTexture): void {
            this._materialsPBR = [];
            this._materialsSTD = [];

            let steelMaterialPBR = new BABYLON.PBRMetallicRoughnessMaterial("steel-pbr", this.game.scene);
            steelMaterialPBR.baseColor = new BABYLON.Color3(0.5, 0.75, 1.0);
            steelMaterialPBR.metallic = 1.0;
            steelMaterialPBR.roughness = 0.15;
            steelMaterialPBR.environmentTexture = envTexture;
            
            let steelMaterialSTD = new BABYLON.StandardMaterial("steel-std", this.game.scene);
            steelMaterialSTD.diffuseColor = new BABYLON.Color3(0.5, 0.6, 0.7);
            steelMaterialSTD.specularColor = new BABYLON.Color3(1, 1, 1);
            steelMaterialSTD.emissiveColor = steelMaterialSTD.diffuseColor.scale(0.5);
            steelMaterialSTD.roughness = 0.15;

            this._materialsPBR.push(steelMaterialPBR);
            this._materialsSTD.push(steelMaterialSTD);


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

            this._materialsPBR.push(copperMaterialPBR);
            this._materialsSTD.push(copperMaterialSTD);

            
            let blackSteelMaterialPBR = new BABYLON.PBRMetallicRoughnessMaterial("steel-pbr", this.game.scene);
            blackSteelMaterialPBR.baseColor = new BABYLON.Color3(0.05, 0.04, 0.045);
            blackSteelMaterialPBR.metallic = 0.85;
            blackSteelMaterialPBR.roughness = 0.15;
            blackSteelMaterialPBR.environmentTexture = envTexture;
            
            let blackSteelMaterialSTD = new BABYLON.StandardMaterial("steel-std", this.game.scene);
            blackSteelMaterialSTD.diffuseColor = new BABYLON.Color3(0.1, 0.11, 0.12);
            blackSteelMaterialSTD.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
            blackSteelMaterialSTD.emissiveColor = blackSteelMaterialSTD.diffuseColor.scale(0.5);
            blackSteelMaterialSTD.roughness = 0.25;

            this._materialsPBR.push(blackSteelMaterialPBR);
            this._materialsSTD.push(blackSteelMaterialSTD);

            
            let redSteelMaterialPBR = new BABYLON.PBRMetallicRoughnessMaterial("red-steel-pbr", this.game.scene);
            redSteelMaterialPBR.baseColor = BABYLON.Color3.FromHexString("#bf212f").scaleInPlace(0.5);
            redSteelMaterialPBR.metallic = 0.8;
            redSteelMaterialPBR.roughness = 0.2;
            redSteelMaterialPBR.environmentTexture = envTexture;
            
            let redSteelMaterialSTD = new BABYLON.StandardMaterial("red-steel-std", this.game.scene);
            redSteelMaterialSTD.diffuseColor = BABYLON.Color3.FromHexString("#bf212f").scaleInPlace(1);
            redSteelMaterialSTD.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
            redSteelMaterialSTD.emissiveColor = redSteelMaterialSTD.diffuseColor.scale(0.5);
            redSteelMaterialSTD.roughness = 0.25;

            this._materialsPBR.push(redSteelMaterialPBR);
            this._materialsSTD.push(redSteelMaterialSTD);

            
            let greenSteelMaterialPBR = new BABYLON.PBRMetallicRoughnessMaterial("green-steel-pbr", this.game.scene);
            greenSteelMaterialPBR.baseColor = BABYLON.Color3.FromHexString("#006f3c").scaleInPlace(0.5);
            greenSteelMaterialPBR.metallic = 0.8;
            greenSteelMaterialPBR.roughness = 0.2;
            greenSteelMaterialPBR.environmentTexture = envTexture;
            
            let greenSteelMaterialSTD = new BABYLON.StandardMaterial("green-steel-std", this.game.scene);
            greenSteelMaterialSTD.diffuseColor = BABYLON.Color3.FromHexString("#006f3c").scaleInPlace(1);
            greenSteelMaterialSTD.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
            greenSteelMaterialSTD.emissiveColor = greenSteelMaterialSTD.diffuseColor.scale(0.5);
            greenSteelMaterialSTD.roughness = 0.25;

            this._materialsPBR.push(greenSteelMaterialPBR);
            this._materialsSTD.push(greenSteelMaterialSTD);

            
            let blueSteelMaterialPBR = new BABYLON.PBRMetallicRoughnessMaterial("blue-steel-pbr", this.game.scene);
            blueSteelMaterialPBR.baseColor = BABYLON.Color3.FromHexString("#264b96").scaleInPlace(0.5);
            blueSteelMaterialPBR.metallic = 0.8;
            blueSteelMaterialPBR.roughness = 0.2;
            blueSteelMaterialPBR.environmentTexture = envTexture;
            
            let blueSteelMaterialSTD = new BABYLON.StandardMaterial("blue-steel-std", this.game.scene);
            blueSteelMaterialSTD.diffuseColor = BABYLON.Color3.FromHexString("#264b96").scaleInPlace(1);
            blueSteelMaterialSTD.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
            blueSteelMaterialSTD.emissiveColor = blueSteelMaterialSTD.diffuseColor.scale(0.5);
            blueSteelMaterialSTD.roughness = 0.25;

            this._materialsPBR.push(blueSteelMaterialPBR);
            this._materialsSTD.push(blueSteelMaterialSTD);

            let plasticBlack = new BABYLON.StandardMaterial("plastic-black", this.game.scene);
            plasticBlack.diffuseColor = BABYLON.Color3.FromHexString("#282a33");
            plasticBlack.specularColor.copyFromFloats(0.1, 0.1, 0.1);
            plasticBlack.emissiveColor.copyFromFloats(0.1, 0.1, 0.1);

            this._materialsPBR.push(plasticBlack);
            this._materialsSTD.push(plasticBlack);

            /*#e6261f,#eb7532,#f7d038,#a3e048,#49da9a,#34bbe6,#4355db,#d23be7*/
            
            this._materialsPBR.push(this._makePlasticPBR("red-plastic-pbr", BABYLON.Color3.FromHexString("#e6261f"), envTexture));
            this._materialsSTD.push(this._makePlasticSTD("red-plastic-std", BABYLON.Color3.FromHexString("#e6261f")));
            
            this._materialsPBR.push(this._makePlasticPBR("orange-plastic-pbr", BABYLON.Color3.FromHexString("#eb7532"), envTexture));
            this._materialsSTD.push(this._makePlasticSTD("orange-plastic-std", BABYLON.Color3.FromHexString("#eb7532")));
            
            this._materialsPBR.push(this._makePlasticPBR("yellow-plastic-pbr", BABYLON.Color3.FromHexString("#f7d038"), envTexture));
            this._materialsSTD.push(this._makePlasticSTD("yellow-plastic-std", BABYLON.Color3.FromHexString("#f7d038")));
            
            this._materialsPBR.push(this._makePlasticPBR("green-plastic-pbr", BABYLON.Color3.FromHexString("#a3e048"), envTexture));
            this._materialsSTD.push(this._makePlasticSTD("green-plastic-std", BABYLON.Color3.FromHexString("#a3e048")));
            
            this._materialsPBR.push(this._makePlasticPBR("eucalyptus-plastic-pbr", BABYLON.Color3.FromHexString("#49da9a"), envTexture));
            this._materialsSTD.push(this._makePlasticSTD("eucalyptus-plastic-std", BABYLON.Color3.FromHexString("#49da9a")));
            
            this._materialsPBR.push(this._makePlasticPBR("blue-plastic-pbr", BABYLON.Color3.FromHexString("#34bbe6"), envTexture));
            this._materialsSTD.push(this._makePlasticSTD("blue-plastic-std", BABYLON.Color3.FromHexString("#34bbe6")));
            
            this._materialsPBR.push(this._makePlasticPBR("royal-blue-plastic-pbr", BABYLON.Color3.FromHexString("#4355db"), envTexture));
            this._materialsSTD.push(this._makePlasticSTD("royal-blue-plastic-std", BABYLON.Color3.FromHexString("#4355db")));
            
            this._materialsPBR.push(this._makePlasticPBR("pink-plastic-pbr", BABYLON.Color3.FromHexString("#d23be7"), envTexture));
            this._materialsSTD.push(this._makePlasticSTD("pink-plastic-std", BABYLON.Color3.FromHexString("#d23be7")));
        }
    }
}
