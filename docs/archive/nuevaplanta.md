<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Onboarding - Identificar Planta</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        rel="stylesheet" />
    <style>
        body {
            font-family: 'Inter', sans-serif;
            overscroll-behavior-y: none;
            -webkit-tap-highlight-color: transparent;
        }

        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }

        .icon-filled {
            font-variation-settings: 'FILL' 1;
        }

        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }

        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }

        .view-hidden {
            display: none !important;
        }

        /* Animación personalizada para el spinner del paso 2 */
        .spinner-ring {
            border: 4px solid #edf3ef;
            border-top: 4px solid #2e5c3a;
            border-radius: 50%;
            width: 64px;
            height: 64px;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% {
                transform: rotate(0deg);
            }

            100% {
                transform: rotate(360deg);
            }
        }

        /* Fondo general suave con tono verdoso claro */
        .bg-app-light {
            background-color: #f4f7f5;
        }

        /* Tema oscuro para el paso 4 */
        .bg-app-dark {
            background-color: #1a3824;
        }
    </style>
</head>

<body class="bg-gray-100 sm:py-8 sm:flex sm:justify-center min-h-screen">

    <!-- Contenedor Principal -->
    <div id="app-container"
        class="w-full h-[100dvh] bg-app-light sm:max-w-[400px] sm:h-[850px] sm:rounded-[2.5rem] sm:shadow-2xl sm:overflow-hidden relative sm:border-[8px] sm:border-gray-900 flex flex-col transition-colors duration-500">

        <main class="flex-1 overflow-y-auto no-scrollbar relative h-full">

            <!-- ========================================== -->
            <!-- PASO 1: IDENTIFICA TU PLANTA -->
            <!-- ========================================== -->
            <div id="step-1" class="px-5 pt-10 pb-8 flex flex-col h-full">
                <!-- Header -->
                <div class="flex items-center justify-between mb-6">
                    <button
                        class="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform"><span
                            class="material-symbols-outlined text-gray-700">arrow_back</span></button>
                    <div class="flex flex-col items-center">
                        <span class="text-[11px] text-green-800 font-medium mb-1.5">Paso 1 de 4</span>
                        <div class="flex gap-1.5">
                            <div class="w-8 h-1 bg-[#2e5c3a] rounded-full"></div>
                            <div class="w-8 h-1 bg-gray-200 rounded-full"></div>
                            <div class="w-8 h-1 bg-gray-200 rounded-full"></div>
                            <div class="w-8 h-1 bg-gray-200 rounded-full"></div>
                        </div>
                    </div>
                    <div class="w-10"></div> <!-- Espaciador -->
                </div>

                <!-- Tarjeta Principal -->
                <div
                    class="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center flex-1">
                    <!-- Ilustración -->
                    <div class="w-28 h-28 bg-[#edf3ef] rounded-full flex items-center justify-center mt-4 relative">
                        <span class="material-symbols-outlined text-[64px] text-[#2e5c3a] icon-filled">eco</span>
                        <!-- Simulación de brillos -->
                        <span class="absolute top-4 left-4 text-[#a3c7af] text-lg font-serif">✦</span>
                        <span class="absolute bottom-6 right-4 text-[#a3c7af] text-sm font-serif">✦</span>
                    </div>

                    <h1 class="text-2xl font-bold text-gray-900 mt-6 tracking-tight">Identifica tu planta</h1>
                    <p class="text-[13px] text-gray-500 mt-3 leading-relaxed px-2">Toma una foto nueva o elige una de tu
                        galería para analizarla y crear el perfil personalizado de tu planta.</p>

                    <div class="w-full mt-auto space-y-3 pt-8">
                        <button onclick="goToStep(2)"
                            class="w-full bg-[#2e5c3a] text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 active:bg-[#23472c] transition-colors shadow-md">
                            <span class="material-symbols-outlined">photo_camera</span> Tomar foto
                        </button>
                        <button
                            class="w-full bg-white border border-[#2e5c3a] text-[#2e5c3a] py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 active:bg-gray-50 transition-colors">
                            <span class="material-symbols-outlined">image</span> Elegir de galería
                        </button>
                    </div>

                    <div class="flex items-center justify-center gap-1.5 mt-6 mb-2 text-[11px] text-gray-500">
                        <span class="material-symbols-outlined text-[14px]">info</span>
                        <span>La imagen debe mostrar hojas y tallo con buena luz.</span>
                    </div>
                </div>
            </div>

            <!-- ========================================== -->
            <!-- PASO 2: ANALIZANDO TU PLANTA -->
            <!-- ========================================== -->
            <div id="step-2" class="px-5 pt-10 pb-8 flex flex-col h-full view-hidden">
                <!-- Header -->
                <div class="flex items-center justify-between mb-6">
                    <button onclick="goToStep(1)"
                        class="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform"><span
                            class="material-symbols-outlined text-gray-700">arrow_back</span></button>
                    <div class="flex flex-col items-center">
                        <span class="text-[11px] text-green-800 font-medium mb-1.5">Paso 2 de 4</span>
                        <div class="flex gap-1.5">
                            <div class="w-8 h-1 bg-[#2e5c3a] rounded-full"></div>
                            <div class="w-8 h-1 bg-[#2e5c3a] rounded-full"></div>
                            <div class="w-8 h-1 bg-gray-200 rounded-full"></div>
                            <div class="w-8 h-1 bg-gray-200 rounded-full"></div>
                        </div>
                    </div>
                    <div class="w-10"></div>
                </div>

                <!-- Tarjeta Principal -->
                <div
                    class="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center flex-1">

                    <!-- Imagen Capturada -->
                    <div class="mt-2 p-1 border-4 border-[#2e5c3a] rounded-[2rem]">
                        <img src="https://images.unsplash.com/photo-1592841200221-a6898f307baa?q=80&w=400&auto=format&fit=crop"
                            alt="Planta" class="w-44 h-44 object-cover rounded-[1.75rem]">
                    </div>

                    <!-- Spinner -->
                    <div class="relative mt-8 mb-6">
                        <div class="spinner-ring"></div>
                        <div class="absolute inset-0 flex items-center justify-center">
                            <span class="material-symbols-outlined text-[#2e5c3a] icon-filled text-[24px]">eco</span>
                        </div>
                    </div>

                    <h2 class="text-2xl font-bold text-gray-900 tracking-tight">Analizando tu planta</h2>
                    <p class="text-[13px] text-gray-500 mt-3 leading-relaxed px-4">Buscando coincidencias en nuestra
                        base botánica y preparando la identificación.</p>

                    <div class="flex items-center gap-1.5 mt-4 text-[12px] text-gray-500 font-medium">
                        <span class="material-symbols-outlined text-[16px]">schedule</span> Esto puede tardar unos
                        segundos
                    </div>

                    <!-- Tip -->
                    <div class="mt-auto w-full bg-[#f4f7f5] rounded-2xl p-4 flex items-start gap-3 text-left">
                        <div class="bg-[#e4ece7] p-1.5 rounded-full flex-shrink-0">
                            <span class="material-symbols-outlined text-[#2e5c3a] icon-filled text-[20px]">eco</span>
                        </div>
                        <p class="text-[12px] text-gray-700 leading-relaxed mt-0.5"><span
                                class="font-bold text-[#2e5c3a]">Consejo:</span> una foto con buena luz mejora la
                            precisión.</p>
                    </div>
                </div>
            </div>

            <!-- ========================================== -->
            <!-- PASO 3: RESULTADO IDENTIFICACIÓN -->
            <!-- ========================================== -->
            <div id="step-3" class="px-5 pt-10 pb-8 flex flex-col h-full view-hidden">
                <!-- Header -->
                <div class="flex items-center justify-between mb-4">
                    <button onclick="goToStep(1)"
                        class="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform"><span
                            class="material-symbols-outlined text-gray-700">arrow_back</span></button>
                    <div class="flex flex-col items-center">
                        <span class="text-[11px] text-green-800 font-medium mb-1.5">Paso 3 de 4</span>
                        <div class="flex gap-1.5">
                            <div class="w-8 h-1 bg-[#2e5c3a] rounded-full"></div>
                            <div class="w-8 h-1 bg-[#2e5c3a] rounded-full"></div>
                            <div class="w-8 h-1 bg-[#2e5c3a] rounded-full"></div>
                            <div class="w-8 h-1 bg-gray-200 rounded-full"></div>
                        </div>
                    </div>
                    <div class="w-10"></div>
                </div>

                <!-- Match Card -->
                <div class="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 mb-6">
                    <img src="https://images.unsplash.com/photo-1592841200221-a6898f307baa?q=80&w=150&auto=format&fit=crop"
                        class="w-20 h-20 rounded-2xl object-cover" alt="Tomate">
                    <div>
                        <h3 class="text-lg font-bold text-gray-900">Tomate</h3>
                        <p class="text-[13px] text-gray-500 italic mt-0.5">Solanum lycopersicum</p>
                        <div
                            class="inline-flex items-center gap-1 bg-[#eef5f0] text-[#2e5c3a] px-2.5 py-1 rounded-full mt-2">
                            <span class="material-symbols-outlined text-[14px]">check_circle</span>
                            <span class="text-[10px] font-semibold">Identificación alta</span>
                        </div>
                    </div>
                </div>

                <h1 class="text-[28px] font-bold text-gray-900 tracking-tight">¡Es un tomate!</h1>
                <p class="text-[13px] text-gray-600 mt-2 leading-relaxed">Completa estos datos para generar un plan de
                    cuidados adaptado a tu clima.</p>

                <!-- Formulario -->
                <div class="mt-8 space-y-6">
                    <!-- Campo Nombre -->
                    <div>
                        <div class="flex justify-between items-center mb-2">
                            <label class="text-[13px] font-semibold text-gray-800">¿Qué nombre quieres ponerle?</label>
                            <span
                                class="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">Opcional</span>
                        </div>
                        <div class="relative">
                            <span
                                class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">potted_plant</span>
                            <input type="text" placeholder="Ej. Tomatín"
                                class="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 rounded-2xl text-[14px] text-gray-800 focus:outline-none focus:border-[#2e5c3a] focus:ring-1 focus:ring-[#2e5c3a] transition-all">
                        </div>
                    </div>

                    <!-- Campo Ciudad -->
                    <div>
                        <label class="block text-[13px] font-semibold text-gray-800 mb-2">¿En qué ciudad te
                            encuentras?</label>
                        <div class="relative">
                            <span
                                class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">location_on</span>
                            <input type="text" placeholder="Ej. Santiago, Chile"
                                class="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 rounded-2xl text-[14px] text-gray-800 focus:outline-none focus:border-[#2e5c3a] focus:ring-1 focus:ring-[#2e5c3a] transition-all">
                        </div>
                        <p class="text-[11px] text-gray-500 mt-2 leading-tight">Usaremos esta ubicación para ajustar
                            riego, sol y alertas al clima local.</p>
                        <button
                            class="mt-3 text-[#2e5c3a] bg-[#eef5f0] px-4 py-2 rounded-xl text-[12px] font-semibold flex items-center gap-1.5 active:bg-[#e4ece7] transition-colors">
                            <span class="material-symbols-outlined text-[16px]">my_location</span> Usar ubicación actual
                        </button>
                    </div>
                </div>

                <div class="mt-auto pt-6">
                    <button onclick="goToStep(4)"
                        class="w-full bg-[#2e5c3a] text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 active:bg-[#23472c] transition-colors shadow-md text-[15px]">
                        Generar plan de cuidados <span class="material-symbols-outlined">arrow_forward</span>
                    </button>
                </div>
            </div>

            <!-- ========================================== -->
            <!-- PASO 4: CREANDO PERFIL (Dark Mode) -->
            <!-- ========================================== -->
            <div id="step-4" class="px-6 pt-16 pb-10 flex flex-col items-center h-full view-hidden">

                <!-- Progreso Final -->
                <div class="flex flex-col items-center mb-16">
                    <span class="text-[11px] text-[#a3c7af] font-medium mb-2.5">Paso 4 de 4</span>
                    <div class="flex gap-2">
                        <div class="w-10 h-[3px] bg-white/30 rounded-full"></div>
                        <div class="w-10 h-[3px] bg-white/30 rounded-full"></div>
                        <div class="w-10 h-[3px] bg-white/30 rounded-full"></div>
                        <div class="w-10 h-[3px] bg-white rounded-full"></div>
                    </div>
                </div>

                <!-- Spinner Dark Mode -->
                <div class="relative mb-10">
                    <!-- Aro exterior animado -->
                    <div class="w-28 h-28 border-[3px] border-white/10 rounded-full border-t-[#a3c7af] animate-spin">
                    </div>
                    <!-- Círculo interior -->
                    <div
                        class="absolute inset-2 bg-white/5 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <span class="material-symbols-outlined text-[48px] text-[#a3c7af] icon-filled">eco</span>
                    </div>
                    <!-- Brillos decorativos -->
                    <span class="absolute top-0 right-4 text-white text-xs animate-pulse">✦</span>
                    <span class="absolute bottom-4 left-2 text-white text-[10px] animate-pulse delay-75">✦</span>
                </div>

                <h1 class="text-[28px] font-bold text-white tracking-tight text-center">Creando perfil...</h1>
                <p class="text-[14px] text-[#a3c7af] mt-4 leading-relaxed text-center max-w-[280px]">Estamos ajustando
                    el plan de cuidados según tu ubicación y el clima actual.</p>

                <!-- Ubicación confirmada -->
                <div class="flex items-center justify-center gap-1.5 mt-8 text-[#86d99f]">
                    <span class="material-symbols-outlined text-[18px]">location_on</span>
                    <span class="text-[13px] font-medium">Santiago, San Miguel</span>
                </div>

                <!-- Status Box -->
                <div
                    class="mt-12 w-full border border-white/20 bg-white/5 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3">
                    <div class="flex gap-1 text-[#a3c7af]">
                        <span class="material-symbols-outlined text-[16px]">water_drop</span>
                        <span class="material-symbols-outlined text-[16px]">light_mode</span>
                        <span class="material-symbols-outlined text-[16px]">notifications</span>
                    </div>
                    <div class="w-[1px] h-4 bg-white/20"></div>
                    <p class="text-[12px] text-white/90">Preparando riego, luz y recordatorios</p>
                </div>

            </div>

        </main>
    </div>

    <!-- Lógica de Navegación -->
    <script>
        let timeoutId;

        function goToStep(step) {
            // Limpiar cualquier timeout pendiente
            if (timeoutId) clearTimeout(timeoutId);

            // Ocultar todos los pasos
            document.getElementById('step-1').classList.add('view-hidden');
            document.getElementById('step-2').classList.add('view-hidden');
            document.getElementById('step-3').classList.add('view-hidden');
            document.getElementById('step-4').classList.add('view-hidden');

            // Mostrar el paso actual
            document.getElementById(`step-${step}`).classList.remove('view-hidden');

            // Lógica de fondos (Claro vs Oscuro)
            const appContainer = document.getElementById('app-container');
            if (step === 4) {
                appContainer.classList.remove('bg-app-light');
                appContainer.classList.add('bg-app-dark');
            } else {
                appContainer.classList.add('bg-app-light');
                appContainer.classList.remove('bg-app-dark');
            }

            // Automatización: Si entramos al Paso 2, simular carga y pasar al Paso 3
            if (step === 2) {
                timeoutId = setTimeout(() => {
                    goToStep(3);
                }, 3000); // 3 segundos de "análisis"
            }
        }
    </script>
</body>

</html>