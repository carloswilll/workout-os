import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import {
  Dumbbell,
  Flame,
  CheckCircle2,
  Sparkles,
  Plus,
  Minus,
  Play,
  Pause,
  SkipForward,
  Clock,
  Check,
  Zap,
  Layers,
  Calendar,
  Target,
  Scale,
  BookOpen,
  CalendarCheck
} from 'lucide-react';

// ============================================================================
// 1. DICIONÁRIO ANATÔMICO E METAS DE VOLUME SEMANAL
// ============================================================================
const MUSCLE_GROUPS: Record<string, any> = {
  chest: {
    id: 'chest',
    name: 'Peitoral',
    WeeklyTarget: 14,
    cameraAngle: 0.25,
    description: 'Peitoral Maior (Clavicular e Esternocostal)'
  },
  shoulders: {
    id: 'shoulders',
    name: 'Ombros (Deltoides)',
    WeeklyTarget: 14,
    cameraAngle: 0.4,
    description: 'Deltoide Anterior, Lateral e Posterior'
  },
  biceps: {
    id: 'biceps',
    name: 'Bíceps Braquial',
    WeeklyTarget: 10,
    cameraAngle: 0.35,
    description: 'Bíceps Cabeça Longa, Curta e Braquial'
  },
  triceps: {
    id: 'triceps',
    name: 'Tríceps Braquial',
    WeeklyTarget: 10,
    cameraAngle: Math.PI - 0.55,
    description: 'Cabeça Longa, Lateral e Medial do Tríceps'
  },
  forearms: {
    id: 'forearms',
    name: 'Antebraços',
    WeeklyTarget: 6,
    cameraAngle: 0.4,
    description: 'Braquiorradial e Flexores/Extensores do Punho'
  },
  back: {
    id: 'back',
    name: 'Costas (Dorsais)',
    WeeklyTarget: 14,
    cameraAngle: Math.PI - 0.25,
    description: 'Latíssimo do Dorso, Redondos e Romboides'
  },
  traps: {
    id: 'traps',
    name: 'Trapézio',
    WeeklyTarget: 8,
    cameraAngle: Math.PI - 0.3,
    description: 'Trapézio Superior, Médio e Inferior'
  },
  abs: {
    id: 'abs',
    name: 'Abdômen & Core',
    WeeklyTarget: 8,
    cameraAngle: 0.3,
    description: 'Reto Abdominal e Oblíquos Externos'
  },
  quads: {
    id: 'quads',
    name: 'Quadríceps',
    WeeklyTarget: 14,
    cameraAngle: 0.45,
    description: 'Reto Femoral, Vasto Lateral, Medial e Intermédio'
  },
  hamstrings: {
    id: 'hamstrings',
    name: 'Posteriores de Coxa',
    WeeklyTarget: 10,
    cameraAngle: Math.PI - 0.4,
    description: 'Bíceps Femoral, Semitendíneo e Semimembranáceo'
  },
  calves: {
    id: 'calves',
    name: 'Panturrilhas',
    WeeklyTarget: 8,
    cameraAngle: Math.PI - 0.35,
    description: 'Gastrocnêmio Medial/Lateral e Sóleo'
  }
};

// ============================================================================
// 2. OBJETIVOS DO USUÁRIO (DEFINIÇÃO/PERDA DE GORDURA, HIPERTROFIA, RECOMP)
// ============================================================================
const TRAINING_GOALS: Record<string, any> = {
  cutting: {
    id: 'cutting',
    name: 'Perder Gordura e Definir',
    badge: 'Cutting & Densidade Metabólica',
    repMultiplierLabel: '12-15 reps (Densidade + Gasto Calórico)',
    restDelta: -15, // Descansos mais curtos para manter frequência cardíaca alta
    cardioNote: '+20 min Cardio HIIT ou Caminhada Inclinada pós-treino',
    calorieGuidance: 'Déficit calórico moderado (-400 a -500 kcal) + 2.0g/kg de proteína'
  },
  hypertrophy: {
    id: 'hypertrophy',
    name: 'Ganho de Massa Muscular',
    badge: 'Hipertrofia Clássica',
    repMultiplierLabel: '8-12 reps (Tensão Mecânica)',
    restDelta: 0,
    cardioNote: 'Cardio leve 15 min para sensibilidade à insulina',
    calorieGuidance: 'Superávit controlado (+250 a +350 kcal) + progressão de carga'
  },
  recomp: {
    id: 'recomp',
    name: 'Recomposição Corporal',
    badge: 'Trocar Gordura por Músculo',
    repMultiplierLabel: '10-12 reps (Híbrido)',
    restDelta: -5,
    cardioNote: '15 min Cardio moderado 3x a 4x na semana',
    calorieGuidance: 'Calorias de manutenção com ciclagem nos dias de treino pesado'
  }
};

// ============================================================================
// 3. BIBLIOTECA DE DIVISÕES DE TREINO (ABC, ABCD, UPPER/LOWER, FULL BODY)
//    Cada exercício possui `animationType` e `propType` para o boneco 3D demonstrar!
// ============================================================================
const SPLIT_PROGRAMS: Record<string, any> = {
  ABC: {
    id: 'ABC',
    name: 'ABC (Peito/Ombro/Bíceps • Costas/Tríceps • Pernas)',
    description: 'Sua divisão favorita com sinergia de empurrar/puxar e alta frequência.',
    weeklySchedule: ['A', 'B', 'C', 'A', 'B', 'C', 'REST'],
    splits: {
      A: {
        id: 'A',
        code: 'Treino A',
        title: 'Peito, Ombro e Bíceps',
        subtitle: 'Empurrar + Flexão de Cotovelo',
        targetMuscles: ['chest', 'shoulders', 'biceps'],
        exercises: [
          {
            id: 'ex_a1',
            name: 'Supino Inclinado com Halteres',
            equipment: 'Halteres + Banco 30°',
            animationType: 'incline_press',
            propType: 'dumbbells',
            primaryMuscles: ['chest'],
            secondaryMuscles: ['shoulders', 'triceps'],
            baseSets: 4,
            targetReps: '8-10',
            cuttingReps: '12-15',
            defaultWeight: 26,
            defaultReps: 12,
            restSeconds: 75,
            notes: 'Escápulas retraídas; desça controlando até alongar as fibras superiores do peitoral.'
          },
          {
            id: 'ex_a2',
            name: 'Crucifixo Máquina (Peck Deck)',
            equipment: 'Máquina Isoladora',
            animationType: 'chest_fly',
            propType: 'none',
            primaryMuscles: ['chest'],
            secondaryMuscles: ['shoulders'],
            baseSets: 3,
            targetReps: '10-12',
            cuttingReps: '12-15',
            defaultWeight: 55,
            defaultReps: 12,
            restSeconds: 60,
            notes: 'Cotovelos levemente flexionados; segure 1s espremendo o peitoral no centro.'
          },
          {
            id: 'ex_a3',
            name: 'Desenvolvimento com Halteres',
            equipment: 'Halteres Sentado',
            animationType: 'shoulder_press',
            propType: 'dumbbells',
            primaryMuscles: ['shoulders'],
            secondaryMuscles: ['triceps', 'traps'],
            baseSets: 4,
            targetReps: '8-10',
            cuttingReps: '10-12',
            defaultWeight: 20,
            defaultReps: 10,
            restSeconds: 75,
            notes: 'Empurre os halteres acima da cabeça mantendo os cotovelos 30° à frente do tronco.'
          },
          {
            id: 'ex_a4',
            name: 'Elevação Lateral com Halteres',
            equipment: 'Halteres Livre',
            animationType: 'lateral_raise',
            propType: 'dumbbells',
            primaryMuscles: ['shoulders'],
            secondaryMuscles: ['traps'],
            baseSets: 4,
            targetReps: '12-15',
            cuttingReps: '15-18',
            defaultWeight: 12,
            defaultReps: 15,
            restSeconds: 60,
            notes: 'Eleve os braços lateralmente guiando pelos cotovelos até a altura dos ombros.'
          },
          {
            id: 'ex_a5',
            name: 'Rosca Direta na Barra W',
            equipment: 'Barra W + Anilhas',
            animationType: 'bicep_curl',
            propType: 'barbell',
            primaryMuscles: ['biceps'],
            secondaryMuscles: ['forearms'],
            baseSets: 3,
            targetReps: '8-10',
            cuttingReps: '12-15',
            defaultWeight: 30,
            defaultReps: 12,
            restSeconds: 60,
            notes: 'Cotovelos colados nas costelas; suba contraindo o bíceps sem balançar o tronco.'
          },
          {
            id: 'ex_a6',
            name: 'Rosca Martelo Alternada',
            equipment: 'Halteres Pegada Neutra',
            animationType: 'hammer_curl',
            propType: 'dumbbells',
            primaryMuscles: ['biceps'],
            secondaryMuscles: ['forearms'],
            baseSets: 3,
            targetReps: '10-12',
            cuttingReps: '12-15',
            defaultWeight: 14,
            defaultReps: 12,
            restSeconds: 60,
            notes: 'Pegada neutra (palmas frente a frente) focando no braquial e antebraço.'
          }
        ]
      },
      B: {
        id: 'B',
        code: 'Treino B',
        title: 'Costas, Trapézio e Tríceps',
        subtitle: 'Tração Dorsal + Extensão de Cotovelo',
        targetMuscles: ['back', 'traps', 'triceps'],
        exercises: [
          {
            id: 'ex_b1',
            name: 'Puxada Alta Aberta (Pulldown)',
            equipment: 'Polia Alta',
            animationType: 'lat_pulldown',
            propType: 'barbell_overhead',
            primaryMuscles: ['back'],
            secondaryMuscles: ['biceps', 'forearms'],
            baseSets: 4,
            targetReps: '8-12',
            cuttingReps: '12-15',
            defaultWeight: 65,
            defaultReps: 12,
            restSeconds: 75,
            notes: 'Traga a barra em direção à parte superior do peito deprimindo as escápulas.'
          },
          {
            id: 'ex_b2',
            name: 'Remada Curvada Pronada',
            equipment: 'Barra Olímpica',
            animationType: 'bent_row',
            propType: 'barbell',
            primaryMuscles: ['back'],
            secondaryMuscles: ['traps', 'biceps', 'forearms'],
            baseSets: 4,
            targetReps: '8-10',
            cuttingReps: '10-12',
            defaultWeight: 55,
            defaultReps: 10,
            restSeconds: 75,
            notes: 'Tronco inclinado a 45°; puxe a barra em direção ao abdômen fechando as escápulas.'
          },
          {
            id: 'ex_b3',
            name: 'Encolhimento com Halteres',
            equipment: 'Halteres Pesados',
            animationType: 'shrug',
            propType: 'dumbbells',
            primaryMuscles: ['traps'],
            secondaryMuscles: ['forearms'],
            baseSets: 3,
            targetReps: '12-15',
            cuttingReps: '15-18',
            defaultWeight: 32,
            defaultReps: 15,
            restSeconds: 60,
            notes: 'Eleve os ombros verticalmente em direção às orelhas e segure 2s no topo.'
          },
          {
            id: 'ex_b4',
            name: 'Tríceps Pulley na Corda',
            equipment: 'Polia Alta + Corda',
            animationType: 'triceps_pushdown',
            propType: 'none',
            primaryMuscles: ['triceps'],
            secondaryMuscles: ['forearms'],
            baseSets: 4,
            targetReps: '10-12',
            cuttingReps: '12-15',
            defaultWeight: 35,
            defaultReps: 12,
            restSeconds: 60,
            notes: 'Cotovelos fixos ao lado do corpo; estenda totalmente o antebraço abrindo a corda.'
          },
          {
            id: 'ex_b5',
            name: 'Tríceps Francês Bilateral',
            equipment: 'Halter Acima da Cabeça',
            animationType: 'overhead_triceps',
            propType: 'dumbbells',
            primaryMuscles: ['triceps'],
            secondaryMuscles: ['shoulders'],
            baseSets: 3,
            targetReps: '10-12',
            cuttingReps: '12-15',
            defaultWeight: 22,
            defaultReps: 12,
            restSeconds: 60,
            notes: 'Desça o peso atrás da nuca alongando a cabeça longa do tríceps e estenda.'
          }
        ]
      },
      C: {
        id: 'C',
        code: 'Treino C',
        title: 'Pernas Completas e Core',
        subtitle: 'Quadríceps, Posteriores, Panturrilha e Abdômen',
        targetMuscles: ['quads', 'hamstrings', 'calves', 'abs'],
        exercises: [
          {
            id: 'ex_c1',
            name: 'Agachamento Livre com Barra',
            equipment: 'Gaiola de Agachamento',
            animationType: 'squat',
            propType: 'barbell_back',
            primaryMuscles: ['quads'],
            secondaryMuscles: ['hamstrings', 'abs'],
            baseSets: 4,
            targetReps: '8-10',
            cuttingReps: '10-12',
            defaultWeight: 85,
            defaultReps: 10,
            restSeconds: 90,
            notes: 'Mantenha o core firme, flexione quadril e joelhos até quebrar a paralela.'
          },
          {
            id: 'ex_c2',
            name: 'Cadeira Extensora',
            equipment: 'Máquina Isoladora',
            animationType: 'leg_extension',
            propType: 'none',
            primaryMuscles: ['quads'],
            secondaryMuscles: [],
            baseSets: 4,
            targetReps: '12-15',
            cuttingReps: '15-18',
            defaultWeight: 65,
            defaultReps: 15,
            restSeconds: 60,
            notes: 'Estenda os joelhos completamente e segure 1s no pico de contração do quadríceps.'
          },
          {
            id: 'ex_c3',
            name: 'Flexora Vertical / Mesa Flexora',
            equipment: 'Máquina de Posteriores',
            animationType: 'leg_curl',
            propType: 'none',
            primaryMuscles: ['hamstrings'],
            secondaryMuscles: ['calves'],
            baseSets: 4,
            targetReps: '10-12',
            cuttingReps: '12-15',
            defaultWeight: 50,
            defaultReps: 12,
            restSeconds: 60,
            notes: 'Flexione os joelhos trazendo o calcanhar em direção ao glúteo com controle.'
          },
          {
            id: 'ex_c4',
            name: 'Panturrilha em Pé',
            equipment: 'Máquina em Pé',
            animationType: 'calf_raise',
            propType: 'none',
            primaryMuscles: ['calves'],
            secondaryMuscles: [],
            baseSets: 4,
            targetReps: '15-20',
            cuttingReps: '18-20',
            defaultWeight: 75,
            defaultReps: 18,
            restSeconds: 45,
            notes: 'Suba na ponta dos pés em amplitude máxima e pause 1s no topo.'
          },
          {
            id: 'ex_c5',
            name: 'Abdominal Supra na Polia (Crunch)',
            equipment: 'Polia Alta + Corda',
            animationType: 'abs_crunch',
            propType: 'none',
            primaryMuscles: ['abs'],
            secondaryMuscles: [],
            baseSets: 4,
            targetReps: '15-20',
            cuttingReps: '18-22',
            defaultWeight: 40,
            defaultReps: 18,
            restSeconds: 45,
            notes: 'Curve a coluna torácica aproximando as costelas da pelve e solte o ar.'
          }
        ]
      }
    }
  },
  UPPER_LOWER: {
    id: 'UPPER_LOWER',
    name: 'Upper / Lower (Superior & Inferior 4x)',
    description: 'Excelente para perder gordura e definir mantendo alta frequência muscular e dias para cardio.',
    weeklySchedule: ['U1', 'L1', 'REST', 'U2', 'L2', 'REST', 'REST'],
    splits: {
      U1: {
        id: 'U1',
        code: 'Upper A',
        title: 'Superior Completo (Ênfase Peito & Costas)',
        subtitle: 'Tronco Completo + Braços',
        targetMuscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
        exercises: [
          {
            id: 'ex_u1',
            name: 'Supino Inclinado com Halteres',
            equipment: 'Halteres + Banco 30°',
            animationType: 'incline_press',
            propType: 'dumbbells',
            primaryMuscles: ['chest'],
            secondaryMuscles: ['shoulders', 'triceps'],
            baseSets: 4,
            targetReps: '8-12',
            cuttingReps: '12-15',
            defaultWeight: 26,
            defaultReps: 12,
            restSeconds: 75,
            notes: 'Controle a descida por 2 segundos e empurre com explosão.'
          },
          {
            id: 'ex_u2',
            name: 'Puxada Alta Aberta (Pulldown)',
            equipment: 'Polia Alta',
            animationType: 'lat_pulldown',
            propType: 'barbell_overhead',
            primaryMuscles: ['back'],
            secondaryMuscles: ['biceps'],
            baseSets: 4,
            targetReps: '10-12',
            cuttingReps: '12-15',
            defaultWeight: 65,
            defaultReps: 12,
            restSeconds: 75,
            notes: 'Puxe os cotovelos para baixo e para trás ativando a dorsal.'
          },
          {
            id: 'ex_u3',
            name: 'Elevação Lateral com Halteres',
            equipment: 'Halteres Livre',
            animationType: 'lateral_raise',
            propType: 'dumbbells',
            primaryMuscles: ['shoulders'],
            secondaryMuscles: ['traps'],
            baseSets: 3,
            targetReps: '12-15',
            cuttingReps: '15-18',
            defaultWeight: 12,
            defaultReps: 15,
            restSeconds: 60,
            notes: 'Foco total na cabeça lateral do deltoide para largura estética.'
          },
          {
            id: 'ex_u4',
            name: 'Rosca Direta na Barra W',
            equipment: 'Barra W',
            animationType: 'bicep_curl',
            propType: 'barbell',
            primaryMuscles: ['biceps'],
            secondaryMuscles: ['forearms'],
            baseSets: 3,
            targetReps: '10-12',
            cuttingReps: '12-15',
            defaultWeight: 30,
            defaultReps: 12,
            restSeconds: 60,
            notes: 'Mantenha os punhos firmes e contraia no topo.'
          },
          {
            id: 'ex_u5',
            name: 'Tríceps Pulley na Corda',
            equipment: 'Polia Alta',
            animationType: 'triceps_pushdown',
            propType: 'none',
            primaryMuscles: ['triceps'],
            secondaryMuscles: ['forearms'],
            baseSets: 3,
            targetReps: '10-12',
            cuttingReps: '12-15',
            defaultWeight: 35,
            defaultReps: 12,
            restSeconds: 60,
            notes: 'Estenda completamente o cotovelo no final do movimento.'
          }
        ]
      },
      L1: {
        id: 'L1',
        code: 'Lower A',
        title: 'Inferior Completo & Core',
        subtitle: 'Alto Gasto Calórico (Pernas + Abdômen)',
        targetMuscles: ['quads', 'hamstrings', 'calves', 'abs'],
        exercises: [
          {
            id: 'ex_l1',
            name: 'Agachamento Livre com Barra',
            equipment: 'Barra Olímpica',
            animationType: 'squat',
            propType: 'barbell_back',
            primaryMuscles: ['quads'],
            secondaryMuscles: ['hamstrings', 'abs'],
            baseSets: 4,
            targetReps: '8-10',
            cuttingReps: '10-12',
            defaultWeight: 85,
            defaultReps: 10,
            restSeconds: 90,
            notes: 'Exercício base de maior gasto energético da ficha.'
          },
          {
            id: 'ex_l2',
            name: 'Cadeira Extensora',
            equipment: 'Máquina Isoladora',
            animationType: 'leg_extension',
            propType: 'none',
            primaryMuscles: ['quads'],
            secondaryMuscles: [],
            baseSets: 3,
            targetReps: '12-15',
            cuttingReps: '15-18',
            defaultWeight: 65,
            defaultReps: 15,
            restSeconds: 60,
            notes: 'Segure 1s no topo para detalhamento do reto femoral e vastos.'
          },
          {
            id: 'ex_l3',
            name: 'Mesa Flexora',
            equipment: 'Máquina',
            animationType: 'leg_curl',
            propType: 'none',
            primaryMuscles: ['hamstrings'],
            secondaryMuscles: ['calves'],
            baseSets: 4,
            targetReps: '10-12',
            cuttingReps: '12-15',
            defaultWeight: 50,
            defaultReps: 12,
            restSeconds: 60,
            notes: 'Controle a fase excêntrica sem levantar o quadril.'
          },
          {
            id: 'ex_l4',
            name: 'Panturrilha em Pé',
            equipment: 'Máquina',
            animationType: 'calf_raise',
            propType: 'none',
            primaryMuscles: ['calves'],
            secondaryMuscles: [],
            baseSets: 4,
            targetReps: '15-20',
            cuttingReps: '18-20',
            defaultWeight: 75,
            defaultReps: 18,
            restSeconds: 45,
            notes: 'Alongue bem no fundo e suba o máximo possível.'
          },
          {
            id: 'ex_l5',
            name: 'Abdominal Supra na Polia',
            equipment: 'Polia Alta',
            animationType: 'abs_crunch',
            propType: 'none',
            primaryMuscles: ['abs'],
            secondaryMuscles: [],
            baseSets: 4,
            targetReps: '15-20',
            cuttingReps: '18-22',
            defaultWeight: 40,
            defaultReps: 18,
            restSeconds: 45,
            notes: 'Solte todo o ar no final da flexão abdominal.'
          }
        ]
      },
      U2: {
        id: 'U2',
        code: 'Upper B',
        title: 'Superior Densidade (Ombros, Costas & Peito)',
        subtitle: 'Estética em V-Taper',
        targetMuscles: ['shoulders', 'back', 'chest', 'biceps', 'triceps'],
        exercises: [
          {
            id: 'ex_u2_1',
            name: 'Desenvolvimento com Halteres',
            equipment: 'Halteres Sentado',
            animationType: 'shoulder_press',
            propType: 'dumbbells',
            primaryMuscles: ['shoulders'],
            secondaryMuscles: ['triceps'],
            baseSets: 4,
            targetReps: '8-12',
            cuttingReps: '12-15',
            defaultWeight: 20,
            defaultReps: 12,
            restSeconds: 75,
            notes: 'Estabilidade no tronco e amplitude completa.'
          },
          {
            id: 'ex_u2_2',
            name: 'Remada Curvada Pronada',
            equipment: 'Barra Olímpica',
            animationType: 'bent_row',
            propType: 'barbell',
            primaryMuscles: ['back'],
            secondaryMuscles: ['traps', 'biceps'],
            baseSets: 4,
            targetReps: '8-10',
            cuttingReps: '10-12',
            defaultWeight: 55,
            defaultReps: 10,
            restSeconds: 75,
            notes: 'Densidade para o meio das costas e romboides.'
          },
          {
            id: 'ex_u2_3',
            name: 'Crucifixo Máquina (Peck Deck)',
            equipment: 'Máquina',
            animationType: 'chest_fly',
            propType: 'none',
            primaryMuscles: ['chest'],
            secondaryMuscles: ['shoulders'],
            baseSets: 3,
            targetReps: '12-15',
            cuttingReps: '15-18',
            defaultWeight: 55,
            defaultReps: 15,
            restSeconds: 60,
            notes: 'Foco em contração máxima das fibras esternais.'
          },
          {
            id: 'ex_u2_4',
            name: 'Rosca Martelo Alternada',
            equipment: 'Halteres',
            animationType: 'hammer_curl',
            propType: 'dumbbells',
            primaryMuscles: ['biceps'],
            secondaryMuscles: ['forearms'],
            baseSets: 3,
            targetReps: '10-12',
            cuttingReps: '12-15',
            defaultWeight: 14,
            defaultReps: 12,
            restSeconds: 60,
            notes: 'Alternado sem girar o tronco.'
          }
        ]
      },
      L2: {
        id: 'L2',
        code: 'Lower B',
        title: 'Inferior Metabólico & Definição Abdominal',
        subtitle: 'Definição de Pernas + Core',
        targetMuscles: ['quads', 'hamstrings', 'calves', 'abs'],
        exercises: [
          {
            id: 'ex_l2_1',
            name: 'Cadeira Extensora',
            equipment: 'Máquina',
            animationType: 'leg_extension',
            propType: 'none',
            primaryMuscles: ['quads'],
            secondaryMuscles: [],
            baseSets: 4,
            targetReps: '12-15',
            cuttingReps: '15-20',
            defaultWeight: 65,
            defaultReps: 15,
            restSeconds: 60,
            notes: 'Cadência controlada 2s na subida e 2s na descida.'
          },
          {
            id: 'ex_l2_2',
            name: 'Mesa Flexora',
            equipment: 'Máquina',
            animationType: 'leg_curl',
            propType: 'none',
            primaryMuscles: ['hamstrings'],
            secondaryMuscles: ['calves'],
            baseSets: 4,
            targetReps: '12-15',
            cuttingReps: '15-18',
            defaultWeight: 50,
            defaultReps: 15,
            restSeconds: 60,
            notes: 'Contração máxima no topo.'
          },
          {
            id: 'ex_l2_3',
            name: 'Abdominal Supra na Polia',
            equipment: 'Polia Alta',
            animationType: 'abs_crunch',
            propType: 'none',
            primaryMuscles: ['abs'],
            secondaryMuscles: [],
            baseSets: 4,
            targetReps: '15-20',
            cuttingReps: '20-25',
            defaultWeight: 40,
            defaultReps: 20,
            restSeconds: 45,
            notes: 'Foco em definição dos gomos abdominais.'
          }
        ]
      }
    }
  },
  FULL_BODY: {
    id: 'FULL_BODY',
    name: 'Full Body Metabólico 3x/4x (Queima Máxima)',
    description: 'Trabalha o corpo todo por sessão para maximizar o EPOC (queima de gordura pós-treino).',
    weeklySchedule: ['FB1', 'REST', 'FB2', 'REST', 'FB1', 'REST', 'REST'],
    splits: {
      FB1: {
        id: 'FB1',
        code: 'Full Body A',
        title: 'Corpo Inteiro A (Compostos + Metabólico)',
        subtitle: 'Peito, Costas, Quadríceps, Ombros e Core',
        targetMuscles: ['quads', 'chest', 'back', 'shoulders', 'abs'],
        exercises: [
          {
            id: 'ex_fb1',
            name: 'Agachamento Livre com Barra',
            equipment: 'Barra Olímpica',
            animationType: 'squat',
            propType: 'barbell_back',
            primaryMuscles: ['quads'],
            secondaryMuscles: ['hamstrings', 'abs'],
            baseSets: 4,
            targetReps: '10-12',
            cuttingReps: '12-15',
            defaultWeight: 80,
            defaultReps: 12,
            restSeconds: 75,
            notes: 'Grande recrutamento muscular para elevar a taxa metabólica.'
          },
          {
            id: 'ex_fb2',
            name: 'Supino Inclinado com Halteres',
            equipment: 'Halteres',
            animationType: 'incline_press',
            propType: 'dumbbells',
            primaryMuscles: ['chest'],
            secondaryMuscles: ['shoulders', 'triceps'],
            baseSets: 4,
            targetReps: '10-12',
            cuttingReps: '12-15',
            defaultWeight: 24,
            defaultReps: 12,
            restSeconds: 60,
            notes: 'Amplitude total alongando o peitoral.'
          },
          {
            id: 'ex_fb3',
            name: 'Puxada Alta Aberta (Pulldown)',
            equipment: 'Polia Alta',
            animationType: 'lat_pulldown',
            propType: 'barbell_overhead',
            primaryMuscles: ['back'],
            secondaryMuscles: ['biceps'],
            baseSets: 4,
            targetReps: '10-12',
            cuttingReps: '12-15',
            defaultWeight: 60,
            defaultReps: 12,
            restSeconds: 60,
            notes: 'Controle na volta alongando as dorsais.'
          },
          {
            id: 'ex_fb4',
            name: 'Elevação Lateral com Halteres',
            equipment: 'Halteres',
            animationType: 'lateral_raise',
            propType: 'dumbbells',
            primaryMuscles: ['shoulders'],
            secondaryMuscles: ['traps'],
            baseSets: 3,
            targetReps: '12-15',
            cuttingReps: '15-18',
            defaultWeight: 12,
            defaultReps: 15,
            restSeconds: 45,
            notes: 'Descanso curto para manter densidade metabólica.'
          },
          {
            id: 'ex_fb5',
            name: 'Abdominal Supra na Polia',
            equipment: 'Polia Alta',
            animationType: 'abs_crunch',
            propType: 'none',
            primaryMuscles: ['abs'],
            secondaryMuscles: [],
            baseSets: 3,
            targetReps: '15-20',
            cuttingReps: '18-22',
            defaultWeight: 40,
            defaultReps: 18,
            restSeconds: 45,
            notes: 'Contração abdominal forte a cada repetição.'
          }
        ]
      },
      FB2: {
        id: 'FB2',
        code: 'Full Body B',
        title: 'Corpo Inteiro B (Posteriores, Ombro & Braços)',
        subtitle: 'Ênfase Cadeia Posterior + Braços',
        targetMuscles: ['hamstrings', 'back', 'shoulders', 'biceps', 'triceps'],
        exercises: [
          {
            id: 'ex_fb2_1',
            name: 'Remada Curvada Pronada',
            equipment: 'Barra Olímpica',
            animationType: 'bent_row',
            propType: 'barbell',
            primaryMuscles: ['back'],
            secondaryMuscles: ['traps', 'biceps'],
            baseSets: 4,
            targetReps: '10-12',
            cuttingReps: '12-15',
            defaultWeight: 55,
            defaultReps: 12,
            restSeconds: 75,
            notes: 'Coluna neutra e tração firme até o umbigo.'
          },
          {
            id: 'ex_fb2_2',
            name: 'Desenvolvimento com Halteres',
            equipment: 'Halteres',
            animationType: 'shoulder_press',
            propType: 'dumbbells',
            primaryMuscles: ['shoulders'],
            secondaryMuscles: ['triceps'],
            baseSets: 4,
            targetReps: '10-12',
            cuttingReps: '12-15',
            defaultWeight: 20,
            defaultReps: 12,
            restSeconds: 60,
            notes: 'Suba os halteres sem bater no topo.'
          },
          {
            id: 'ex_fb2_3',
            name: 'Mesa Flexora',
            equipment: 'Máquina',
            animationType: 'leg_curl',
            propType: 'none',
            primaryMuscles: ['hamstrings'],
            secondaryMuscles: ['calves'],
            baseSets: 4,
            targetReps: '12-15',
            cuttingReps: '15-18',
            defaultWeight: 50,
            defaultReps: 15,
            restSeconds: 60,
            notes: 'Isolamento de posteriores de coxa.'
          },
          {
            id: 'ex_fb2_4',
            name: 'Rosca Direta na Barra W',
            equipment: 'Barra W',
            animationType: 'bicep_curl',
            propType: 'barbell',
            primaryMuscles: ['biceps'],
            secondaryMuscles: ['forearms'],
            baseSets: 3,
            targetReps: '10-12',
            cuttingReps: '12-15',
            defaultWeight: 30,
            defaultReps: 12,
            restSeconds: 60,
            notes: 'Foco em pico de contração do bíceps.'
          },
          {
            id: 'ex_fb2_5',
            name: 'Tríceps Pulley na Corda',
            equipment: 'Polia Alta',
            animationType: 'triceps_pushdown',
            propType: 'none',
            primaryMuscles: ['triceps'],
            secondaryMuscles: ['forearms'],
            baseSets: 3,
            targetReps: '10-12',
            cuttingReps: '12-15',
            defaultWeight: 35,
            defaultReps: 12,
            restSeconds: 60,
            notes: 'Extensão máxima de cotovelo.'
          }
        ]
      }
    }
  }
};

const WEEK_DAYS = [
  { index: 0, short: 'Seg', full: 'Segunda-feira' },
  { index: 1, short: 'Ter', full: 'Terça-feira' },
  { index: 2, short: 'Qua', full: 'Quarta-feira' },
  { index: 3, short: 'Qui', full: 'Quinta-feira' },
  { index: 4, short: 'Sex', full: 'Sexta-feira' },
  { index: 5, short: 'Sáb', full: 'Sábado' },
  { index: 6, short: 'Dom', full: 'Domingo' }
];

// ============================================================================
// 4. VISUALIZADOR 3D ARTICULADO COM DEMONSTRAÇÃO DE EXERCÍCIOS EM TEMPO REAL
// ============================================================================
interface BodyVisualizerProps {
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  debtMuscles?: string[];
  viewMode?: string;
  targetCameraAngle?: number;
  animationType?: string;
  propType?: string;
  exerciseName?: string;
}

const BodyVisualizer3D = ({
  primaryMuscles = [],
  secondaryMuscles = [],
  debtMuscles = [],
  viewMode = 'exercise',
  targetCameraAngle = 0.25,
  animationType = 'incline_press',
  propType = 'dumbbells',
  exerciseName = ''
}: BodyVisualizerProps) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const mannequinGroupRef = useRef<THREE.Group | null>(null);
  const rigRef = useRef<any>({});
  const muscleMeshesRef = useRef<Record<string, THREE.Mesh[]>>({});
  const targetRotationYRef = useRef(targetCameraAngle);
  const currentRotationYRef = useRef(targetCameraAngle);
  const isDraggingRef = useRef(false);
  const previousPointerXRef = useRef(0);

  const [isPlayingDemo, setIsPlayingDemo] = useState(true);
  const [demoSpeed, setDemoSpeed] = useState(1);
  const [cameraPreset, setCameraPreset] = useState('front');

  const isPlayingRef = useRef(true);
  const demoSpeedRef = useRef(1);
  const animTypeRef = useRef(animationType);
  const propTypeRef = useRef(propType);

  useEffect(() => {
    isPlayingRef.current = isPlayingDemo;
  }, [isPlayingDemo]);

  useEffect(() => {
    demoSpeedRef.current = demoSpeed;
  }, [demoSpeed]);

  useEffect(() => {
    animTypeRef.current = animationType;
    propTypeRef.current = propType;
    // Atualiza visibilidade dos acessórios 3D (Halteres / Barra)
    if (rigRef.current.props) {
      const { leftDumbbell, rightDumbbell, frontBarbell, backBarbell } = rigRef.current.props;
      if (leftDumbbell) leftDumbbell.visible = propType === 'dumbbells';
      if (rightDumbbell) rightDumbbell.visible = propType === 'dumbbells';
      if (frontBarbell) {
        frontBarbell.visible = propType === 'barbell' || propType === 'barbell_overhead';
      }
      if (backBarbell) backBarbell.visible = propType === 'barbell_back';
    }
  }, [animationType, propType]);

  useEffect(() => {
    targetRotationYRef.current = targetCameraAngle;
    setCameraPreset(Math.abs(targetCameraAngle) > 1.5 ? 'back' : 'front');
  }, [targetCameraAngle]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 420;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 0.35, 6.4);
    camera.lookAt(0, 0.15, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Iluminação Estúdio Biomecânico
    const ambientLight = new THREE.AmbientLight(0x94a3b8, 0.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);

    const rimLightLeft = new THREE.PointLight(0x10b981, 1.3, 12);
    rimLightLeft.position.set(-3.5, 2, -2.5);
    scene.add(rimLightLeft);

    const rimLightRight = new THREE.PointLight(0x06b6d4, 1.2, 12);
    rimLightRight.position.set(3.5, 1.5, -2.5);
    scene.add(rimLightRight);

    const mannequin = new THREE.Group();
    mannequin.position.y = -0.15;
    mannequinGroupRef.current = mannequin;
    scene.add(mannequin);

    const muscleMap: Record<string, THREE.Mesh[]> = {
      chest: [],
      shoulders: [],
      biceps: [],
      triceps: [],
      forearms: [],
      back: [],
      traps: [],
      abs: [],
      quads: [],
      hamstrings: [],
      calves: []
    };

    const structuralMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.45,
      metalness: 0.55,
      emissive: 0x020617,
      emissiveIntensity: 0.2
    });

    const jointMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.7,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.15
    });

    const chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.2,
      metalness: 0.9
    });

    const plateMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.8,
      emissive: 0x10b981,
      emissiveIntensity: 0.15
    });

    const createMuscleMaterial = () =>
      new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.35,
        metalness: 0.4,
        emissive: 0x000000,
        emissiveIntensity: 0
      });

    const addMusclePart = (
      parentGroup: THREE.Group | THREE.Object3D,
      muscleKey: string,
      geometry: THREE.BufferGeometry,
      pos: [number, number, number] | number[],
      rot: [number, number, number] | number[] = [0, 0, 0],
      scale: [number, number, number] | number[] = [1, 1, 1]
    ) => {
      const mat = createMuscleMaterial();
      const mesh = new THREE.Mesh(geometry, mat);
      mesh.position.set(pos[0], pos[1], pos[2]);
      mesh.rotation.set(rot[0], rot[1], rot[2]);
      mesh.scale.set(scale[0], scale[1], scale[2]);
      mesh.userData = { muscleKey };
      parentGroup.add(mesh);
      if (!muscleMap[muscleKey]) muscleMap[muscleKey] = [];
      muscleMap[muscleKey].push(mesh);
      return mesh;
    };

    // ------------------------------------------------------------------------
    // HIERARQUIA ESQUELÉTICA ARTICULADA (PARA ANIMAÇÃO DE EXERCÍCIOS)
    // ------------------------------------------------------------------------
    // 1. Pelve (Raiz de movimento vertical para Agachamento)
    const pelvisGroup = new THREE.Group();
    pelvisGroup.position.set(0, 0.25, 0);
    mannequin.add(pelvisGroup);

    const pelvisMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.30, 0.28, 0.28, 16),
      structuralMaterial
    );
    pelvisMesh.scale.set(1.18, 1, 0.75);
    pelvisGroup.add(pelvisMesh);

    // 2. Torso (Articulado na cintura para Remada Curvada, Supino Inclinado e Abdominal)
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 0.12, 0); // Relativo à pelve (y global = 0.37)
    pelvisGroup.add(torsoGroup);

    // Caixa Torácica
    const ribcageMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.29, 0.85, 16),
      structuralMaterial
    );
    ribcageMesh.position.set(0, 0.58, 0);
    ribcageMesh.scale.set(1.15, 1, 0.68);
    torsoGroup.add(ribcageMesh);

    // Cabeça + Visor + Pescoço
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 24), structuralMaterial);
    headMesh.position.set(0, 1.41, 0.02);
    headMesh.scale.set(0.88, 1.12, 0.95);
    torsoGroup.add(headMesh);

    const visorMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.07, 0.12),
      new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x06b6d4,
        emissiveIntensity: 0.7
      })
    );
    visorMesh.position.set(0, 1.43, 0.19);
    torsoGroup.add(visorMesh);

    const neckMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.13, 0.22, 16),
      structuralMaterial
    );
    neckMesh.position.set(0, 1.15, 0);
    torsoGroup.add(neckMesh);

    // Músculos do Tronco (Peito, Costas, Trapézio, Abdômen)
    [-1, 1].forEach((side) => {
      // Peitoral
      addMusclePart(
        torsoGroup,
        'chest',
        new THREE.SphereGeometry(0.22, 18, 18),
        [0.19 * side, 0.85, 0.17],
        [0.1, 0.18 * side, -0.15 * side],
        [1.15, 0.68, 0.55]
      );
      addMusclePart(
        torsoGroup,
        'chest',
        new THREE.BoxGeometry(0.34, 0.24, 0.16),
        [0.19 * side, 0.71, 0.18],
        [0.05, 0.14 * side, -0.06 * side],
        [1.0, 0.95, 0.85]
      );

      // Trapézio
      addMusclePart(
        torsoGroup,
        'traps',
        new THREE.CylinderGeometry(0.08, 0.22, 0.26, 16),
        [0.21 * side, 1.07, -0.03],
        [0.15, 0, 0.52 * side],
        [1.0, 0.9, 0.65]
      );
      addMusclePart(
        torsoGroup,
        'traps',
        new THREE.SphereGeometry(0.18, 16, 16),
        [0.11 * side, 0.87, -0.18],
        [0, 0, 0.1 * side],
        [0.85, 1.35, 0.45]
      );

      // Dorsais (Back)
      addMusclePart(
        torsoGroup,
        'back',
        new THREE.CylinderGeometry(0.24, 0.11, 0.68, 16),
        [0.26 * side, 0.61, -0.14],
        [0.08, -0.15 * side, -0.22 * side],
        [0.92, 1.0, 0.62]
      );
      addMusclePart(
        torsoGroup,
        'back',
        new THREE.CylinderGeometry(0.11, 0.09, 0.42, 12),
        [0.10 * side, 0.25, -0.15],
        [0, 0, 0.04 * side],
        [0.9, 1.0, 0.55]
      );

      // Abdômen
      [0.49, 0.34, 0.19].forEach((yPos, idx) => {
        addMusclePart(
          torsoGroup,
          'abs',
          new THREE.BoxGeometry(0.13, 0.12, 0.10),
          [0.08 * side, yPos, 0.18 - idx * 0.01],
          [0, 0.08 * side, 0],
          [1.0, 0.92, 0.85]
        );
      });
    });

    // Barra Olímpica nas Costas (Visível no Agachamento Livre)
    const backBarbell = new THREE.Group();
    backBarbell.position.set(0, 1.04, -0.16);
    const backBarShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 2.1, 12),
      chromeMaterial
    );
    backBarShaft.rotation.z = Math.PI / 2;
    backBarbell.add(backBarShaft);
    [-0.85, -0.78, 0.78, 0.85].forEach((xPlate) => {
      const plate = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 0.045, 20),
        plateMaterial
      );
      plate.rotation.z = Math.PI / 2;
      plate.position.x = xPlate;
      backBarbell.add(plate);
    });
    torsoGroup.add(backBarbell);

    // 3. Articulações dos Ombros e Cotovelos (Esquerdo e Direito)
    const createDumbbellMesh = () => {
      const dbGroup = new THREE.Group();
      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.022, 0.28, 12),
        chromeMaterial
      );
      handle.rotation.z = Math.PI / 2;
      dbGroup.add(handle);
      [-0.11, 0.11].forEach((px) => {
        const weight = new THREE.Mesh(
          new THREE.CylinderGeometry(0.095, 0.095, 0.05, 16),
          plateMaterial
        );
        weight.rotation.z = Math.PI / 2;
        weight.position.x = px;
        dbGroup.add(weight);
      });
      return dbGroup;
    };

    const armRigs: Record<string, any> = {};
    [-1, 1].forEach((side) => {
      const key = side === -1 ? 'left' : 'right';
      const shoulderPivot = new THREE.Group();
      shoulderPivot.position.set(0.52 * side, 0.91, 0.02); // Relativo ao torsoGroup
      torsoGroup.add(shoulderPivot);

      // Deltoide
      addMusclePart(
        shoulderPivot,
        'shoulders',
        new THREE.SphereGeometry(0.19, 20, 20),
        [0, 0, 0],
        [0, 0, -0.15 * side],
        [0.95, 1.18, 0.95]
      );

      // Bíceps e Tríceps (Braço Superior)
      addMusclePart(
        shoulderPivot,
        'biceps',
        new THREE.SphereGeometry(0.125, 18, 18),
        [0.03 * side, -0.34, 0.055],
        [0.05, 0, 0],
        [0.82, 1.62, 0.82]
      );
      addMusclePart(
        shoulderPivot,
        'triceps',
        new THREE.SphereGeometry(0.13, 18, 18),
        [0.04 * side, -0.32, -0.055],
        [-0.05, 0, 0],
        [0.88, 1.65, 0.85]
      );

      // Pivô do Cotovelo
      const elbowPivot = new THREE.Group();
      elbowPivot.position.set(0.05 * side, -0.60, 0);
      shoulderPivot.add(elbowPivot);

      const elbowJoint = new THREE.Mesh(new THREE.SphereGeometry(0.095, 14, 14), jointMaterial);
      elbowPivot.add(elbowJoint);

      // Antebraço
      addMusclePart(
        elbowPivot,
        'forearms',
        new THREE.CylinderGeometry(0.105, 0.07, 0.45, 16),
        [0.02 * side, -0.25, 0.02],
        [0.06, 0, 0],
        [0.95, 1.0, 0.92]
      );

      // Mão
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 14), structuralMaterial);
      hand.position.set(0.03 * side, -0.52, 0.04);
      hand.scale.set(0.75, 1.15, 0.9);
      elbowPivot.add(hand);

      // Halter na Mão
      const dumbbell = createDumbbellMesh();
      dumbbell.position.set(0.03 * side, -0.54, 0.06);
      elbowPivot.add(dumbbell);

      armRigs[key] = { shoulderPivot, elbowPivot, dumbbell };
    });

    // Barra Frontal (Anexada à mão esquerda e alinhada horizontalmente para Rosca/Remada/Pulldown)
    const frontBarbell = new THREE.Group();
    frontBarbell.position.set(0.55, -0.54, 0.08); // Relativo ao cotovelo esquerdo
    const frontShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 1.75, 12),
      chromeMaterial
    );
    frontShaft.rotation.z = Math.PI / 2;
    frontBarbell.add(frontShaft);
    [-0.75, 0.75].forEach((px) => {
      const plate = new THREE.Mesh(
        new THREE.CylinderGeometry(0.17, 0.17, 0.04, 18),
        plateMaterial
      );
      plate.rotation.z = Math.PI / 2;
      plate.position.x = px;
      frontBarbell.add(plate);
    });
    armRigs.left.elbowPivot.add(frontBarbell);

    // 4. Articulações dos Quadris e Joelhos (Pernas Esquerda e Direita)
    const legRigs: Record<string, any> = {};
    [-1, 1].forEach((side) => {
      const key = side === -1 ? 'left' : 'right';
      const hipPivot = new THREE.Group();
      hipPivot.position.set(0.22 * side, -0.05, 0); // Relativo ao pelvisGroup
      pelvisGroup.add(hipPivot);

      // Quadríceps e Posteriores
      addMusclePart(
        hipPivot,
        'quads',
        new THREE.CylinderGeometry(0.175, 0.135, 0.68, 18),
        [0, -0.42, 0.055],
        [-0.04, 0, 0],
        [1.02, 1.0, 0.88]
      );
      addMusclePart(
        hipPivot,
        'quads',
        new THREE.SphereGeometry(0.11, 16, 16),
        [-0.05 * side, -0.64, 0.10],
        [0, 0, 0.15 * side],
        [0.85, 1.35, 0.8]
      );
      addMusclePart(
        hipPivot,
        'hamstrings',
        new THREE.CylinderGeometry(0.165, 0.125, 0.66, 18),
        [0, -0.40, -0.065],
        [0.04, 0, 0],
        [0.98, 1.0, 0.85]
      );

      // Pivô do Joelho
      const kneePivot = new THREE.Group();
      kneePivot.position.set(0, -0.82, 0.02);
      hipPivot.add(kneePivot);

      const kneeJoint = new THREE.Mesh(new THREE.SphereGeometry(0.125, 16, 16), jointMaterial);
      kneePivot.add(kneeJoint);

      // Panturrilha e Canela
      addMusclePart(
        kneePivot,
        'calves',
        new THREE.SphereGeometry(0.135, 18, 18),
        [0, -0.30, -0.06],
        [0.06, 0, 0],
        [0.88, 1.65, 0.95]
      );
      addMusclePart(
        kneePivot,
        'calves',
        new THREE.CylinderGeometry(0.105, 0.075, 0.64, 16),
        [0, -0.40, 0],
        [0, 0, 0],
        [0.9, 1.0, 0.9]
      );

      // Pé
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.10, 0.30), structuralMaterial);
      foot.position.set(0, -0.77, 0.06);
      kneePivot.add(foot);

      legRigs[key] = { hipPivot, kneePivot, foot };
    });

    // Plataforma Holográfica na Base
    const platformRing = new THREE.Mesh(
      new THREE.RingGeometry(0.72, 0.76, 48),
      new THREE.MeshBasicMaterial({
        color: 0x10b981,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5
      })
    );
    platformRing.rotation.x = Math.PI / 2;
    platformRing.position.y = -1.45;
    mannequin.add(platformRing);

    rigRef.current = {
      pelvisGroup,
      torsoGroup,
      leftArm: armRigs.left,
      rightArm: armRigs.right,
      leftLeg: legRigs.left,
      rightLeg: legRigs.right,
      props: {
        leftDumbbell: armRigs.left.dumbbell,
        rightDumbbell: armRigs.right.dumbbell,
        frontBarbell,
        backBarbell
      }
    };

    // Ajusta visibilidade inicial dos equipamentos 3D
    const currentProp = propTypeRef.current;
    armRigs.left.dumbbell.visible = currentProp === 'dumbbells';
    armRigs.right.dumbbell.visible = currentProp === 'dumbbells';
    frontBarbell.visible = currentProp === 'barbell' || currentProp === 'barbell_overhead';
    backBarbell.visible = currentProp === 'barbell_back';

    muscleMeshesRef.current = muscleMap;

    // ------------------------------------------------------------------------
    // LOOP DE CINEMÁTICA DOS EXERCÍCIOS EM TEMPO REAL
    // ------------------------------------------------------------------------
    let animationFrameId: number;
    const clock = new THREE.Clock();
    let animPhaseTime = 0;

    const resetRigPose = (rig: any) => {
      rig.pelvisGroup.position.set(0, 0.25, 0);
      rig.torsoGroup.rotation.set(0, 0, 0);
      rig.leftArm.shoulderPivot.position.set(-0.52, 0.91, 0.02);
      rig.rightArm.shoulderPivot.position.set(0.52, 0.91, 0.02);
      rig.leftArm.shoulderPivot.rotation.set(0, 0, -0.12);
      rig.rightArm.shoulderPivot.rotation.set(0, 0, 0.12);
      rig.leftArm.elbowPivot.rotation.set(0, 0, 0);
      rig.rightArm.elbowPivot.rotation.set(0, 0, 0);
      rig.leftLeg.hipPivot.rotation.set(0, 0, 0);
      rig.rightLeg.hipPivot.rotation.set(0, 0, 0);
      rig.leftLeg.kneePivot.rotation.set(0, 0, 0);
      rig.rightLeg.kneePivot.rotation.set(0, 0, 0);
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      if (isPlayingRef.current) {
        animPhaseTime += delta * 2.8 * demoSpeedRef.current;
      }

      // Fase suave de 0 (início excêntrico) a 1 (pico concêntrico)
      const phase = (Math.sin(animPhaseTime) + 1) * 0.5;
      const rig = rigRef.current;

      if (rig && rig.pelvisGroup) {
        resetRigPose(rig);
        const type = animTypeRef.current;

        switch (type) {
          case 'incline_press':
            // Tronco inclinado para trás, braços empurrando halteres para cima e para frente
            rig.torsoGroup.rotation.x = -0.35;
            rig.leftArm.shoulderPivot.rotation.set(-0.85 - phase * 0.85, 0.35 * (1 - phase), -0.65 + phase * 0.45);
            rig.rightArm.shoulderPivot.rotation.set(-0.85 - phase * 0.85, -0.35 * (1 - phase), 0.65 - phase * 0.45);
            rig.leftArm.elbowPivot.rotation.set(-1.55 + phase * 1.25, 0, 0);
            rig.rightArm.elbowPivot.rotation.set(-1.55 + phase * 1.25, 0, 0);
            break;

          case 'chest_fly':
            // Braços abertos na horizontal fechando à frente do peitoral (Peck Deck / Crucifixo)
            rig.leftArm.shoulderPivot.rotation.set(-1.35, 0, -1.15 + phase * 0.95);
            rig.rightArm.shoulderPivot.rotation.set(-1.35, 0, 1.15 - phase * 0.95);
            rig.leftArm.elbowPivot.rotation.set(-0.45, 0, 0.25);
            rig.rightArm.elbowPivot.rotation.set(-0.45, 0, -0.25);
            break;

          case 'shoulder_press':
            // Desenvolvimento: braços elevados acima da cabeça estendendo os cotovelos
            rig.leftArm.shoulderPivot.rotation.set(-2.65 - phase * 0.35, 0, -0.75 + phase * 0.52);
            rig.rightArm.shoulderPivot.rotation.set(-2.65 - phase * 0.35, 0, 0.75 - phase * 0.52);
            rig.leftArm.elbowPivot.rotation.set(-1.45 * (1 - phase), 0, 0);
            rig.rightArm.elbowPivot.rotation.set(-1.45 * (1 - phase), 0, 0);
            break;

          case 'lateral_raise':
            // Elevação Lateral: abdução dos ombros até 95 graus
            rig.leftArm.shoulderPivot.rotation.set(-0.15, 0, -0.15 - phase * 1.42);
            rig.rightArm.shoulderPivot.rotation.set(-0.15, 0, 0.15 + phase * 1.42);
            rig.leftArm.elbowPivot.rotation.set(-0.25, 0, 0);
            rig.rightArm.elbowPivot.rotation.set(-0.25, 0, 0);
            break;

          case 'bicep_curl':
            // Rosca Direta: braços fixos ao lado do tronco, flexão pura dos cotovelos
            rig.leftArm.shoulderPivot.rotation.set(-0.12, 0, -0.08);
            rig.rightArm.shoulderPivot.rotation.set(-0.12, 0, 0.08);
            rig.leftArm.elbowPivot.rotation.set(-0.2 - phase * 2.05, 0, 0);
            rig.rightArm.elbowPivot.rotation.set(-0.2 - phase * 2.05, 0, 0);
            break;

          case 'hammer_curl': {
            // Rosca Martelo Alternada: braço esquerdo e direito alternam a fase
            const phaseRight = (Math.sin(animPhaseTime + Math.PI) + 1) * 0.5;
            rig.leftArm.elbowPivot.rotation.set(-0.2 - phase * 2.0, 0, 0);
            rig.rightArm.elbowPivot.rotation.set(-0.2 - phaseRight * 2.0, 0, 0);
            break;
          }

          case 'lat_pulldown':
            // Puxada Alta: braços puxam de cima para a lateral dos ombros
            rig.leftArm.shoulderPivot.rotation.set(-2.85 + phase * 1.15, 0, -0.35 - phase * 0.45);
            rig.rightArm.shoulderPivot.rotation.set(-2.85 + phase * 1.15, 0, 0.35 + phase * 0.45);
            rig.leftArm.elbowPivot.rotation.set(-0.25 - phase * 1.35, 0, 0);
            rig.rightArm.elbowPivot.rotation.set(-0.25 - phase * 1.35, 0, 0);
            break;

          case 'bent_row':
            // Remada Curvada: tronco inclinado à frente a 45°, puxando barra ao abdômen
            rig.torsoGroup.rotation.x = 0.68;
            rig.leftLeg.hipPivot.rotation.x = -0.25;
            rig.rightLeg.hipPivot.rotation.x = -0.25;
            rig.leftLeg.kneePivot.rotation.x = 0.35;
            rig.rightLeg.kneePivot.rotation.x = 0.35;
            rig.leftArm.shoulderPivot.rotation.set(-0.75 + phase * 0.95, 0, -0.15);
            rig.rightArm.shoulderPivot.rotation.set(-0.75 + phase * 0.95, 0, 0.15);
            rig.leftArm.elbowPivot.rotation.set(-0.2 - phase * 1.45, 0, 0);
            rig.rightArm.elbowPivot.rotation.set(-0.2 - phase * 1.45, 0, 0);
            break;

          case 'shrug':
            // Encolhimento de Trapézio: elevação escapular
            rig.leftArm.shoulderPivot.position.y = 0.91 + phase * 0.14;
            rig.rightArm.shoulderPivot.position.y = 0.91 + phase * 0.14;
            break;

          case 'triceps_pushdown':
            // Tríceps Pulley: cotovelos colados ao tronco estendendo de 110° até 0°
            rig.leftArm.shoulderPivot.rotation.set(-0.08, 0, -0.1);
            rig.rightArm.shoulderPivot.rotation.set(-0.08, 0, 0.1);
            rig.leftArm.elbowPivot.rotation.set(-1.85 * (1 - phase), 0, 0);
            rig.rightArm.elbowPivot.rotation.set(-1.85 * (1 - phase), 0, 0);
            break;

          case 'overhead_triceps':
            // Tríceps Francês: braços elevados, antebraço desce atrás da cabeça e estende
            rig.leftArm.shoulderPivot.rotation.set(-2.95, 0, -0.2);
            rig.rightArm.shoulderPivot.rotation.set(-2.95, 0, 0.2);
            rig.leftArm.elbowPivot.rotation.set(-2.1 * (1 - phase), 0, 0);
            rig.rightArm.elbowPivot.rotation.set(-2.1 * (1 - phase), 0, 0);
            break;

          case 'squat':
            // Agachamento Livre: pelve desce, quadril e joelhos flexionam, mãos seguram a barra
            rig.pelvisGroup.position.y = 0.25 - phase * 0.48;
            rig.torsoGroup.rotation.x = phase * 0.32;
            rig.leftLeg.hipPivot.rotation.x = -phase * 1.32;
            rig.rightLeg.hipPivot.rotation.x = -phase * 1.32;
            rig.leftLeg.kneePivot.rotation.x = phase * 1.65;
            rig.rightLeg.kneePivot.rotation.x = phase * 1.65;
            rig.leftArm.shoulderPivot.rotation.set(-0.4, 0, -0.65);
            rig.rightArm.shoulderPivot.rotation.set(-0.4, 0, 0.65);
            rig.leftArm.elbowPivot.rotation.set(-1.95, 0, 0);
            rig.rightArm.elbowPivot.rotation.set(-1.95, 0, 0);
            break;

          case 'leg_extension':
            // Cadeira Extensora: quadril flexionado, joelhos estendem à frente
            rig.leftLeg.hipPivot.rotation.x = -0.85;
            rig.rightLeg.hipPivot.rotation.x = -0.85;
            rig.leftLeg.kneePivot.rotation.x = 1.45 * (1 - phase);
            rig.rightLeg.kneePivot.rotation.x = 1.45 * (1 - phase);
            break;

          case 'leg_curl':
            // Flexora: flexão dos joelhos levando o calcanhar atrás
            rig.leftLeg.kneePivot.rotation.x = phase * 1.75;
            rig.rightLeg.kneePivot.rotation.x = phase * 1.75;
            break;

          case 'calf_raise':
            // Panturrilha em Pé: elevação plantar
            rig.pelvisGroup.position.y = 0.25 + phase * 0.16;
            break;

          case 'abs_crunch':
            // Abdominal Supra: flexão torácica com mãos próximas à cabeça
            rig.torsoGroup.rotation.x = phase * 0.55;
            rig.leftArm.shoulderPivot.rotation.set(-1.8, 0, -0.5);
            rig.rightArm.shoulderPivot.rotation.set(-1.8, 0, 0.5);
            rig.leftArm.elbowPivot.rotation.set(-1.8, 0, 0);
            rig.rightArm.elbowPivot.rotation.set(-1.8, 0, 0);
            break;

          default:
            break;
        }
      }

      // Interpolação suave da câmera/rotação Y do personagem
      if (mannequinGroupRef.current) {
        currentRotationYRef.current +=
          (targetRotationYRef.current - currentRotationYRef.current) * 0.09;
        mannequinGroupRef.current.rotation.y = currentRotationYRef.current;
      }

      // Efeito de brilho pulsante sincronizado com a contração muscular (phase)
      const contractionGlow = isPlayingRef.current
        ? phase
        : (Math.sin(elapsedTime * 4.0) + 1) * 0.5;

      Object.entries(muscleMeshesRef.current).forEach(([, meshes]) => {
        (meshes as THREE.Mesh[]).forEach((mesh: any) => {
          const role = mesh.userData.highlightRole;
          if (role === 'primary') {
            mesh.material.emissiveIntensity = 0.35 + contractionGlow * 0.65;
          } else if (role === 'secondary') {
            mesh.material.emissiveIntensity = 0.2 + contractionGlow * 0.35;
          } else if (role === 'debt') {
            mesh.material.emissiveIntensity = 0.35 + contractionGlow * 0.5;
          } else {
            mesh.material.emissiveIntensity = 0.04;
          }
        });
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const newWidth = mountRef.current.clientWidth || 360;
      const newHeight = mountRef.current.clientHeight || 420;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const muscleMap = muscleMeshesRef.current;
    if (!muscleMap) return;

    Object.entries(muscleMap).forEach(([muscleKey, meshes]) => {
      const isPrimary = primaryMuscles.includes(muscleKey);
      const isSecondary = !isPrimary && secondaryMuscles.includes(muscleKey);
      const isDebt = viewMode === 'debt' && debtMuscles.includes(muscleKey);

      (meshes as THREE.Mesh[]).forEach((mesh: any) => {
        if (viewMode === 'debt') {
          if (isDebt) {
            mesh.userData.highlightRole = 'debt';
            mesh.material.color.setHex(0x06b6d4);
            mesh.material.emissive.setHex(0x0891b2);
            mesh.material.roughness = 0.22;
          } else {
            mesh.userData.highlightRole = 'neutral';
            mesh.material.color.setHex(0x1e293b);
            mesh.material.emissive.setHex(0x020617);
            mesh.material.roughness = 0.45;
          }
        } else if (isPrimary) {
          mesh.userData.highlightRole = 'primary';
          mesh.material.color.setHex(0x10b981);
          mesh.material.emissive.setHex(0x059669);
          mesh.material.roughness = 0.2;
        } else if (isSecondary) {
          mesh.userData.highlightRole = 'secondary';
          mesh.material.color.setHex(0xf59e0b);
          mesh.material.emissive.setHex(0xd97706);
          mesh.material.roughness = 0.28;
        } else {
          mesh.userData.highlightRole = 'neutral';
          mesh.material.color.setHex(0x1e293b);
          mesh.material.emissive.setHex(0x0f172a);
          mesh.material.roughness = 0.45;
        }
      });
    });
  }, [primaryMuscles, secondaryMuscles, debtMuscles, viewMode]);

  const handlePointerDown = (clientX: number) => {
    isDraggingRef.current = true;
    previousPointerXRef.current = clientX;
  };

  const handlePointerMove = (clientX: number) => {
    if (!isDraggingRef.current) return;
    const deltaX = clientX - previousPointerXRef.current;
    previousPointerXRef.current = clientX;
    targetRotationYRef.current += deltaX * 0.012;
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const rotateToPreset = (preset: string) => {
    setCameraPreset(preset);
    targetRotationYRef.current =
      preset === 'front' ? 0.25 : preset === 'side' ? Math.PI / 2 : Math.PI - 0.25;
  };

  return (
    <div className="relative w-full h-full flex flex-col select-none">
      {/* Controles de Ângulo e Reprodução da Demonstração 3D */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-1 bg-slate-950/90 backdrop-blur-md border border-slate-800 px-2 py-1.5 rounded-xl pointer-events-auto shadow-lg">
          <button
            onClick={() => rotateToPreset('front')}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${cameraPreset === 'front'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            Frontal
          </button>
          <button
            onClick={() => rotateToPreset('side')}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${cameraPreset === 'side'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            Perfil
          </button>
          <button
            onClick={() => rotateToPreset('back')}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${cameraPreset === 'back'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            Dorsal
          </button>
        </div>

        {/* Controles da Animação do Exercício */}
        <div className="flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-md border border-slate-800 px-2.5 py-1.5 rounded-xl pointer-events-auto shadow-lg">
          <button
            onClick={() => setIsPlayingDemo((p) => !p)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${isPlayingDemo
              ? 'bg-emerald-500 text-slate-950'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
          >
            {isPlayingDemo ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isPlayingDemo ? 'Demonstrando' : 'Pausado'}
          </button>
          <button
            onClick={() => setDemoSpeed((s) => (s === 1 ? 0.5 : s === 0.5 ? 1.5 : 1))}
            className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[10px] font-mono font-bold text-cyan-300"
            title="Velocidade da execução biomecânica"
          >
            {demoSpeed}x
          </button>
        </div>
      </div>

      {/* Canvas 3D */}
      <div
        ref={mountRef}
        onMouseDown={(e) => handlePointerDown(e.clientX)}
        onMouseMove={(e) => handlePointerMove(e.clientX)}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={(e) => e.touches[0] && handlePointerDown(e.touches[0].clientX)}
        onTouchMove={(e) => e.touches[0] && handlePointerMove(e.touches[0].clientX)}
        onTouchEnd={handlePointerUp}
        className="w-full flex-1 min-h-[300px] sm:min-h-[360px] lg:min-h-[410px] cursor-grab active:cursor-grabbing relative"
      />

      {/* Barra de Status da Demonstração 3D */}
      <div className="px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/70 bg-slate-950/75">
        <div className="flex flex-wrap items-center gap-1.5">
          {primaryMuscles.map((mKey) => (
            <button
              key={`pri-${mKey}`}
              onClick={() => {
                if (MUSCLE_GROUPS[mKey]) {
                  targetRotationYRef.current = MUSCLE_GROUPS[mKey].cameraAngle;
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5"
            >
              <Flame className="w-3.5 h-3.5 text-emerald-400" />
              {MUSCLE_GROUPS[mKey]?.name || mKey}
            </button>
          ))}
          {secondaryMuscles.map((mKey) => (
            <button
              key={`sec-${mKey}`}
              onClick={() => {
                if (MUSCLE_GROUPS[mKey]) {
                  targetRotationYRef.current = MUSCLE_GROUPS[mKey].cameraAngle;
                }
              }}
              className="px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/35 text-amber-300 text-xs font-medium flex items-center gap-1"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              {MUSCLE_GROUPS[mKey]?.name || mKey}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-slate-400">
          Execução 3D: <strong className="text-emerald-300">{exerciseName}</strong>
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// 5. APLICATIVO PRINCIPAL (WORKOUT OS)
// ============================================================================
export default function App() {
  // --------------------------------------------------------------------------
  // 5.1 PERFIL DO USUÁRIO (OBJETIVO, PESO ATUAL, META DE PESO, DIVISÃO E MODO DE ADAPTAÇÃO)
  // --------------------------------------------------------------------------
  interface UserProfile {
    goal: string;
    currentWeightKg: number;
    targetWeightKg: number;
    splitSystem: string;
    adaptationMode: string;
  }

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('workout_os_user_profile_v3');
      return saved
        ? JSON.parse(saved)
        : {
          goal: 'cutting', // 'cutting' (Perder Gordura e Definir) | 'hypertrophy' | 'recomp'
          currentWeightKg: 84.5,
          targetWeightKg: 76.0,
          splitSystem: 'ABC', // 'ABC' | 'UPPER_LOWER' | 'FULL_BODY'
          adaptationMode: 'cross_day' // 'cross_day' (Adaptar nos próximos dias) | 'same_day'
        };
    } catch {
      return {
        goal: 'cutting',
        currentWeightKg: 84.5,
        targetWeightKg: 76.0,
        splitSystem: 'ABC',
        adaptationMode: 'cross_day'
      };
    }
  });

  // Evolução de Peso Mensal
  const [monthlyWeightLogs, setMonthlyWeightLogs] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('workout_os_monthly_weights_v3');
      return saved
        ? JSON.parse(saved)
        : [
          { id: 'w1', month: 'Jun', weight: 88.2, bodyFat: 22.5, note: 'Início do protocolo' },
          { id: 'w2', month: 'Jul', weight: 86.8, bodyFat: 21.1, note: 'Ajuste cardio + dieta' },
          { id: 'w3', month: 'Ago', weight: 85.6, bodyFat: 19.8, note: 'Aumento de definição' },
          { id: 'w4', month: 'Set', weight: 84.5, bodyFat: 18.4, note: 'Mês atual' }
        ];
    } catch {
      return [];
    }
  });

  // Check-in por Dia da Semana (Seg a Dom)
  const [weeklyCheckins, setWeeklyCheckins] = useState<Record<string | number, any>>(() => {
    try {
      const saved = localStorage.getItem('workout_os_weekly_checkins_v3');
      return saved
        ? JSON.parse(saved)
        : {
          0: { completed: true, dateLabel: 'Concluído' }, // Segunda
          1: { completed: true, dateLabel: 'Concluído' }, // Terça
          2: { completed: false, dateLabel: 'Hoje' },     // Quarta
          3: { completed: false, dateLabel: 'Pendente' },
          4: { completed: false, dateLabel: 'Pendente' },
          5: { completed: false, dateLabel: 'Pendente' },
          6: { completed: false, dateLabel: 'Descanso' }
        };
    } catch {
      return {};
    }
  });

  const [selectedDayIndex, setSelectedDayIndex] = useState(2); // Quarta-feira selecionada por padrão

  // Fila de Exercícios Pendentes Entre Dias ("O Que Falta Treinar na Semana")
  const [pendingCrossDayExercises, setPendingCrossDayExercises] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('workout_os_cross_day_backlog_v3');
      return saved
        ? JSON.parse(saved)
        : [
          {
            id: 'pending_demo_1',
            exerciseId: 'ex_a2',
            name: 'Crucifixo Máquina (Peck Deck)',
            equipment: 'Máquina Isoladora',
            animationType: 'chest_fly',
            propType: 'none',
            primaryMuscles: ['chest'],
            secondaryMuscles: ['shoulders'],
            missedSets: 3,
            defaultWeight: 55,
            defaultReps: 12,
            targetReps: '12-15',
            restSeconds: 60,
            notes: 'Faltou na Segunda-feira — reagendado para reposição na semana.',
            originDayName: 'Segunda-feira',
            recommendedDayIndex: 3 // Quinta-feira
          }
        ];
    } catch {
      return [];
    }
  });

  // Exercícios do backlog que o usuário puxou para fazer no dia atual
  const [importedBacklogExercises, setImportedBacklogExercises] = useState<any[]>([]);

  // Déficit de séries por grupo muscular
  const [adaptiveDebtByMuscle, setAdaptiveDebtByMuscle] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('workout_os_adaptive_debt_v3');
      return saved
        ? JSON.parse(saved)
        : {
          chest: 3,
          shoulders: 0,
          biceps: 0,
          triceps: 0,
          forearms: 0,
          back: 0,
          traps: 0,
          abs: 0,
          quads: 0,
          hamstrings: 0,
          calves: 0
        };
    } catch {
      return {};
    }
  });

  // Volume semanal já realizado por grupo muscular
  const [weeklyCompletedVolume, setWeeklyCompletedVolume] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('workout_os_weekly_volume_v3');
      return saved
        ? JSON.parse(saved)
        : {
          chest: 8,
          shoulders: 8,
          biceps: 6,
          triceps: 7,
          forearms: 4,
          back: 8,
          traps: 3,
          abs: 4,
          quads: 8,
          hamstrings: 4,
          calves: 4
        };
    } catch {
      return {};
    }
  });

  // Estados de interface e navegação
  const [activeTab, setActiveTab] = useState('workout'); // 'workout' | 'catalog' | 'progress' | 'adaptive' | 'profile'
  const [activeSplitKey, setActiveSplitKey] = useState('A');
  const [selectedExerciseId, setSelectedExerciseId] = useState('ex_a1');
  const [visualizerMode, setVisualizerMode] = useState('exercise');
  const [skippedExercisesInSession, setSkippedExercisesInSession] = useState<string[]>([]);
  const [sessionSetLogs, setSessionSetLogs] = useState<Record<string, any>>({});
  const [toastMessage, setToastMessage] = useState<{ title: string; subtitle: string } | null>(null);
  const [catalogMuscleFilter, setCatalogMuscleFilter] = useState('all');

  // Inputs para adicionar novo registro mensal de peso
  const [newMonthName, setNewMonthName] = useState('Out');
  const [newMonthWeight, setNewMonthWeight] = useState('83.4');
  const [newMonthBodyFat, setNewMonthBodyFat] = useState('17.5');
  const [newMonthNote, setNewMonthNote] = useState('Foco em definição + cardio');

  // Cronômetro de Descanso
  const [restTimer, setRestTimer] = useState({
    active: false,
    remaining: 0,
    total: 60,
    exerciseName: ''
  });

  useEffect(() => {
    localStorage.setItem('workout_os_user_profile_v3', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('workout_os_monthly_weights_v3', JSON.stringify(monthlyWeightLogs));
  }, [monthlyWeightLogs]);

  useEffect(() => {
    localStorage.setItem('workout_os_weekly_checkins_v3', JSON.stringify(weeklyCheckins));
  }, [weeklyCheckins]);

  useEffect(() => {
    localStorage.setItem(
      'workout_os_cross_day_backlog_v3',
      JSON.stringify(pendingCrossDayExercises)
    );
  }, [pendingCrossDayExercises]);

  useEffect(() => {
    localStorage.setItem('workout_os_adaptive_debt_v3', JSON.stringify(adaptiveDebtByMuscle));
  }, [adaptiveDebtByMuscle]);

  useEffect(() => {
    localStorage.setItem('workout_os_weekly_volume_v3', JSON.stringify(weeklyCompletedVolume));
  }, [weeklyCompletedVolume]);

  const showNotification = useCallback((title: string, subtitle: string) => {
    setToastMessage({ title, subtitle });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.title === title ? null : prev));
    }, 4500);
  }, []);

  useEffect(() => {
    if (!restTimer.active || restTimer.remaining <= 0) return;
    const interval = setInterval(() => {
      setRestTimer((prev) => {
        if (prev.remaining <= 1) return { ...prev, active: false, remaining: 0 };
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [restTimer.active, restTimer.remaining]);

  // Obtém o programa atual (ABC, UPPER_LOWER, FULL_BODY)
  const currentProgram = SPLIT_PROGRAMS[userProfile.splitSystem] || SPLIT_PROGRAMS.ABC;
  const availableSplits = currentProgram.splits;
  const currentGoalConfig = TRAINING_GOALS[userProfile.goal] || TRAINING_GOALS.cutting;

  // Garante que activeSplitKey exista no programa selecionado
  const validSplitKey = availableSplits[activeSplitKey]
    ? activeSplitKey
    : Object.keys(availableSplits)[0];
  const currentSplit = availableSplits[validSplitKey];

  // Constrói a lista de exercícios da sessão respeitando o modo de adaptação escolhido
  const sessionExercises = useMemo(() => {
    const baseList = currentSplit.exercises.map((ex: any) => {
      const isSkipped = skippedExercisesInSession.includes(ex.id);
      const primaryMuscle = ex.primaryMuscles[0];

      // Se o modo for 'same_day', injeta séries extras na mesma sessão;
      // Se for 'cross_day' (Adaptação em Dias), NÃO sobrecarrega o treino do mesmo dia!
      let extraSameDaySets = 0;
      if (
        userProfile.adaptationMode === 'same_day' &&
        !isSkipped &&
        (adaptiveDebtByMuscle[primaryMuscle] || 0) > 0
      ) {
        extraSameDaySets = Math.min(2, adaptiveDebtByMuscle[primaryMuscle]);
      }

      const adjustedTargetReps =
        userProfile.goal === 'cutting' && ex.cuttingReps ? ex.cuttingReps : ex.targetReps;
      const adjustedRest = Math.max(30, (ex.restSeconds || 60) + currentGoalConfig.restDelta);

      return {
        ...ex,
        isSkipped,
        isFromBacklog: false,
        adaptiveExtraSets: extraSameDaySets,
        totalSetsCount: isSkipped ? 0 : ex.baseSets + extraSameDaySets,
        displayTargetReps: adjustedTargetReps,
        displayRestSeconds: adjustedRest
      };
    });

    // Adiciona exercícios pendentes de outros dias que o usuário decidiu repor hoje
    const backlogList = importedBacklogExercises.map((bEx: any) => ({
      ...bEx,
      id: bEx.id,
      isSkipped: false,
      isFromBacklog: true,
      baseSets: bEx.missedSets,
      adaptiveExtraSets: 0,
      totalSetsCount: bEx.missedSets,
      displayTargetReps: bEx.targetReps || '12-15',
      displayRestSeconds: 60
    }));

    return [...baseList, ...backlogList];
  }, [
    currentSplit,
    skippedExercisesInSession,
    userProfile.adaptationMode,
    userProfile.goal,
    adaptiveDebtByMuscle,
    importedBacklogExercises,
    currentGoalConfig.restDelta
  ]);

  // Inicializa logs de séries da sessão
  useEffect(() => {
    setSessionSetLogs((prev) => {
      const updated = { ...prev };
      sessionExercises.forEach((ex: any) => {
        const currentSets = updated[ex.id] || [];
        const nextSets = [];
        for (let i = 0; i < ex.totalSetsCount; i++) {
          if (currentSets[i]) {
            nextSets.push({
              ...currentSets[i],
              isAdaptive: ex.isFromBacklog || i >= ex.baseSets
            });
          } else {
            nextSets.push({
              setNumber: i + 1,
              weight: ex.defaultWeight,
              reps: ex.defaultReps,
              completed: false,
              isAdaptive: ex.isFromBacklog || i >= ex.baseSets
            });
          }
        }
        updated[ex.id] = nextSets;
      });
      return updated;
    });
  }, [sessionExercises]);

  // Exercício selecionado atualmente para o visualizador 3D
  const allCatalogExercises = useMemo(() => {
    const list: any[] = [];
    Object.values(SPLIT_PROGRAMS).forEach((prog: any) => {
      Object.values(prog.splits).forEach((sp: any) => {
        sp.exercises.forEach((ex: any) => {
          if (!list.find((item: any) => item.name === ex.name)) {
            list.push({ ...ex, splitTitle: sp.title, programName: prog.name });
          }
        });
      });
    });
    return list;
  }, []);

  const selectedExercise = useMemo(() => {
    return (
      sessionExercises.find((e: any) => e.id === selectedExerciseId) ||
      allCatalogExercises.find((e: any) => e.id === selectedExerciseId) ||
      sessionExercises[0] ||
      allCatalogExercises[0]
    );
  }, [sessionExercises, allCatalogExercises, selectedExerciseId]);

  // Músculos destacados no 3D
  const highlightedMuscles3D = useMemo(() => {
    const debtMuscles = Object.keys(adaptiveDebtByMuscle).filter(
      (m) => (adaptiveDebtByMuscle[m] || 0) > 0
    );

    if (visualizerMode === 'split') {
      const pri = new Set<string>();
      const sec = new Set<string>();
      sessionExercises.forEach((ex: any) => {
        if (!ex.isSkipped) {
          ex.primaryMuscles.forEach((m: string) => pri.add(m));
          ex.secondaryMuscles.forEach((m: string) => {
            if (!pri.has(m)) sec.add(m);
          });
        }
      });
      const priList = Array.from(pri);
      const priFirst = priList[0];
      return {
        primary: priList,
        secondary: Array.from(sec),
        debt: debtMuscles,
        cameraAngle: (priFirst && MUSCLE_GROUPS[priFirst]?.cameraAngle) || 0.25
      };
    }

    if (visualizerMode === 'debt') {
      const firstDebt = debtMuscles[0] || 'chest';
      return {
        primary: [],
        secondary: [],
        debt: debtMuscles,
        cameraAngle: MUSCLE_GROUPS[firstDebt]?.cameraAngle || 0.25
      };
    }

    const primary = selectedExercise?.primaryMuscles || ['chest'];
    const secondary = selectedExercise?.secondaryMuscles || [];
    const mainMuscle = primary[0] || 'chest';
    return {
      primary,
      secondary,
      debt: debtMuscles,
      cameraAngle: MUSCLE_GROUPS[mainMuscle]?.cameraAngle ?? 0.25
    };
  }, [visualizerMode, selectedExercise, sessionExercises, adaptiveDebtByMuscle]);

  // --------------------------------------------------------------------------
  // 5.2 HANDLERS: CHECK-IN SEMANAL, ADAPTAÇÃO ENTRE DIAS E PESO MENSAL
  // --------------------------------------------------------------------------
  const handleSelectWeekDay = (dayIdx: number) => {
    setSelectedDayIndex(dayIdx);
    const scheduledSplitCode = currentProgram.weeklySchedule[dayIdx];
    if (scheduledSplitCode && scheduledSplitCode !== 'REST' && availableSplits[scheduledSplitCode]) {
      setActiveSplitKey(scheduledSplitCode);
      const firstEx = availableSplits[scheduledSplitCode].exercises[0];
      if (firstEx) setSelectedExerciseId(firstEx.id);
    }
  };

  const toggleDayCheckin = (dayIdx: number, e?: any) => {
    if (e) e.stopPropagation();
    setWeeklyCheckins((prev) => {
      const current = prev[dayIdx]?.completed || false;
      const nextCompleted = !current;
      return {
        ...prev,
        [dayIdx]: {
          completed: nextCompleted,
          dateLabel: nextCompleted ? 'Check-in OK' : 'Pendente'
        }
      };
    });
    const dayName = WEEK_DAYS[dayIdx]?.full || 'Dia';
    showNotification(
      `Check-in de ${dayName} atualizado!`,
      `Sua frequência semanal foi registrada com sucesso.`
    );
  };

  // Quando pula um exercício: envia para os PRÓXIMOS DIAS DA SEMANA (sem sobrecarregar o mesmo dia!)
  const handleSkipExerciseToNextDays = (exercise: any) => {
    const sets = (sessionSetLogs[exercise.id] || []) as any[];
    const completedCount = sets.filter((s: any) => s.completed).length;
    const missedSets = Math.max(1, exercise.baseSets - completedCount);
    const primaryMuscle = exercise.primaryMuscles[0];
    const originDayName = WEEK_DAYS[selectedDayIndex]?.full || 'Hoje';
    const nextDayIndex = Math.min(6, selectedDayIndex + 1);

    setSkippedExercisesInSession((prev) =>
      prev.includes(exercise.id) ? prev : [...prev, exercise.id]
    );

    setAdaptiveDebtByMuscle((prev) => ({
      ...prev,
      [primaryMuscle]: (prev[primaryMuscle] || 0) + missedSets
    }));

    // Adiciona na fila de "O Que Falta Treinar na Semana" para ser feito em outro dia
    const newBacklogItem = {
      id: `backlog_${Date.now()}`,
      exerciseId: exercise.id,
      name: exercise.name,
      equipment: exercise.equipment,
      animationType: exercise.animationType,
      propType: exercise.propType,
      primaryMuscles: exercise.primaryMuscles,
      secondaryMuscles: exercise.secondaryMuscles,
      missedSets,
      defaultWeight: exercise.defaultWeight,
      defaultReps: exercise.defaultReps,
      targetReps: exercise.displayTargetReps,
      restSeconds: exercise.displayRestSeconds,
      notes: `Transferido de ${originDayName} para manter seu volume semanal sem sobrecarregar o treino de hoje.`,
      originDayName,
      recommendedDayIndex: nextDayIndex
    };

    setPendingCrossDayExercises((prev) => [newBacklogItem, ...prev]);

    showNotification(
      userProfile.adaptationMode === 'cross_day'
        ? `Transferido para os Próximos Dias (${WEEK_DAYS[nextDayIndex]?.short})`
        : `Adaptado na Ficha (+${missedSets} séries)`,
      userProfile.adaptationMode === 'cross_day'
        ? `"${exercise.name}" (${missedSets} séries) não sobrecarregará hoje: entrou em "O Que Falta Treinar na Semana".`
        : `Séries redistribuídas nos exercícios do mesmo grupamento.`
    );
  };

  // Puxar um exercício pendente da semana para o treino do dia atual
  const handlePullBacklogToToday = (backlogItem: any) => {
    setImportedBacklogExercises((prev) => [...prev, backlogItem]);
    setPendingCrossDayExercises((prev) => prev.filter((item: any) => item.id !== backlogItem.id));
    setSelectedExerciseId(backlogItem.id);
    setActiveTab('workout');

    showNotification(
      `Reposição Adicionada ao Treino de Hoje!`,
      `"${backlogItem.name}" (${backlogItem.missedSets} séries) foi incluído na sessão atual.`
    );
  };

  const updateSetField = (exerciseId: string, setIndex: number, field: string, deltaOrValue: any, isDelta = false) => {
    setSessionSetLogs((prev) => {
      const list = [...(prev[exerciseId] || [])];
      if (!list[setIndex]) return prev;
      const currentVal = Number(list[setIndex][field]) || 0;
      const newVal = isDelta
        ? Math.max(0, currentVal + deltaOrValue)
        : Math.max(0, Number(deltaOrValue));
      list[setIndex] = { ...list[setIndex], [field]: newVal };
      return { ...prev, [exerciseId]: list };
    });
  };

  const toggleSetCompleted = (exercise: any, setIndex: number) => {
    const currentList = (sessionSetLogs[exercise.id] || []) as any[];
    const targetSet = currentList[setIndex];
    if (!targetSet) return;
    const nextCompleted = !targetSet.completed;

    setSessionSetLogs((prev) => {
      const list = [...(prev[exercise.id] || [])];
      list[setIndex] = { ...list[setIndex], completed: nextCompleted };
      return { ...prev, [exercise.id]: list };
    });

    const primaryMuscle = exercise.primaryMuscles[0];
    if (primaryMuscle) {
      setWeeklyCompletedVolume((prev) => ({
        ...prev,
        [primaryMuscle]: Math.max(0, (prev[primaryMuscle] || 0) + (nextCompleted ? 1 : -1))
      }));

      if (exercise.isFromBacklog) {
        setAdaptiveDebtByMuscle((prev) => ({
          ...prev,
          [primaryMuscle]: Math.max(0, (prev[primaryMuscle] || 0) - (nextCompleted ? 1 : -1))
        }));
      }
    }

    if (nextCompleted) {
      setRestTimer({
        active: true,
        remaining: exercise.displayRestSeconds || 60,
        total: exercise.displayRestSeconds || 60,
        exerciseName: exercise.name
      });
    }
  };

  // Finalizar o treino do dia e marcar Check-in automaticamente
  const handleFinishDayWorkout = () => {
    // Verifica se algum exercício ficou incompleto hoje e manda para os próximos dias
    const newlyPendingItems: any[] = [];
    sessionExercises.forEach((ex: any) => {
      if (ex.isSkipped) return;
      const sets = (sessionSetLogs[ex.id] || []) as any[];
      const uncompletedCount = sets.filter((s: any) => !s.completed).length;
      if (uncompletedCount > 0 && !ex.isFromBacklog) {
        newlyPendingItems.push({
          id: `backlog_${Date.now()}_${ex.id}`,
          exerciseId: ex.id,
          name: ex.name,
          equipment: ex.equipment,
          animationType: ex.animationType,
          propType: ex.propType,
          primaryMuscles: ex.primaryMuscles,
          secondaryMuscles: ex.secondaryMuscles,
          missedSets: uncompletedCount,
          defaultWeight: ex.defaultWeight,
          defaultReps: ex.defaultReps,
          targetReps: ex.displayTargetReps,
          restSeconds: ex.displayRestSeconds,
          notes: `Faltaram ${uncompletedCount} série(s) em ${WEEK_DAYS[selectedDayIndex]?.full}.`,
          originDayName: WEEK_DAYS[selectedDayIndex]?.full || 'Hoje',
          recommendedDayIndex: Math.min(6, selectedDayIndex + 1)
        });
      }
    });

    if (newlyPendingItems.length > 0) {
      setPendingCrossDayExercises((prev) => [...newlyPendingItems, ...prev]);
    }

    // Marca Check-in do dia da semana atual como concluído
    setWeeklyCheckins((prev) => ({
      ...prev,
      [selectedDayIndex]: { completed: true, dateLabel: 'Concluído' }
    }));

    setImportedBacklogExercises([]);
    setSkippedExercisesInSession([]);

    showNotification(
      `Check-in de ${WEEK_DAYS[selectedDayIndex]?.full} Concluído!`,
      newlyPendingItems.length > 0
        ? `${newlyPendingItems.length} exercício(s) incompleto(s) foram enviados para "O Que Falta Treinar na Semana" nos próximos dias.`
        : `100% do treino do dia finalizado! Excelente consistência.`
    );
  };

  // Adicionar novo peso mensal
  const handleAddMonthlyWeight = (e: any) => {
    e.preventDefault();
    const parsedWeight = parseFloat(newMonthWeight);
    if (isNaN(parsedWeight) || parsedWeight <= 0) return;

    const entry = {
      id: `w_${Date.now()}`,
      month: newMonthName || 'Mês',
      weight: parsedWeight,
      bodyFat: parseFloat(newMonthBodyFat) || 18.0,
      note: newMonthNote || 'Registro mensal'
    };

    setMonthlyWeightLogs((prev) => [...prev, entry]);
    setUserProfile((prev) => ({ ...prev, currentWeightKg: parsedWeight }));
    showNotification(
      `Peso de ${entry.month} Registrado (${parsedWeight} kg)`,
      `Gráfico de evolução mensal e distância até sua meta (${userProfile.targetWeightKg} kg) atualizados!`
    );
  };

  // Resumo do que falta treinar na semana por grupo muscular
  const missingVolumeSummary = useMemo(() => {
    return Object.values(MUSCLE_GROUPS).map((m: any) => {
      const done = weeklyCompletedVolume[m.id] || 0;
      const remaining = Math.max(0, m.WeeklyTarget - done);
      const pct = Math.min(100, Math.round((done / m.WeeklyTarget) * 100));
      return {
        ...m,
        done,
        remaining,
        pct
      };
    });
  }, [weeklyCompletedVolume]);

  const totalWeeklyCheckinsDone = useMemo(() => {
    return Object.values(weeklyCheckins).filter((c: any) => c.completed).length;
  }, [weeklyCheckins]);

  const weightDifferenceToGoal = useMemo(() => {
    return Number((userProfile.currentWeightKg - userProfile.targetWeightKg).toFixed(1));
  }, [userProfile.currentWeightKg, userProfile.targetWeightKg]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24 lg:pb-12 selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* TOAST DE NOTIFICAÇÃO */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-sm bg-slate-900/95 backdrop-blur-xl border border-emerald-500/40 rounded-2xl p-4 shadow-2xl flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">{toastMessage.title}</p>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toastMessage.subtitle}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-500 hover:text-slate-300 text-xs font-bold px-1.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* HEADER TOPBAR */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Dumbbell className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold tracking-tight text-white">
                  WORKOUT <span className="text-emerald-400">OS</span>
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {currentGoalConfig.name}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Atual: <strong className="text-white">{userProfile.currentWeightKg} kg</strong> → Meta:{' '}
                <strong className="text-emerald-400">{userProfile.targetWeightKg} kg</strong> • Divisão:{' '}
                <strong className="text-cyan-300">{userProfile.splitSystem}</strong>
              </p>
            </div>
          </div>

          {/* Cronômetro de Descanso + Abas Desktop */}
          <div className="flex items-center gap-2.5">
            {restTimer.active && (
              <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl">
                <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="font-mono font-bold text-emerald-300 text-sm">
                  {Math.floor(restTimer.remaining / 60)}:
                  {String(restTimer.remaining % 60).padStart(2, '0')}
                </span>
                <button
                  onClick={() => setRestTimer((prev) => ({ ...prev, active: false }))}
                  className="text-slate-400 hover:text-white text-xs font-semibold ml-1"
                >
                  Pular
                </button>
              </div>
            )}

            <nav className="hidden lg:flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              {[
                { id: 'workout', label: 'Treino & Check-in', icon: Dumbbell },
                { id: 'catalog', label: 'Treinos & Exercícios', icon: BookOpen },
                {
                  id: 'adaptive',
                  label: 'O Que Falta Treinar',
                  icon: CalendarCheck,
                  badge: pendingCrossDayExercises.length
                },
                { id: 'progress', label: 'Peso Mensal & Volume', icon: Scale },
                { id: 'profile', label: 'Meu Objetivo & Meta', icon: Target }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                    {Boolean(tab.badge && tab.badge > 0) && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${isActive
                          ? 'bg-slate-950 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-300'
                          }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* ====================================================================
          BARRA DE CHECK-IN POR DIA DA SEMANA (SEG A DOM)
      ==================================================================== */}
      <section className="max-w-7xl mx-auto px-4 pt-4">
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Check-in de Treino por Dia da Semana ({totalWeeklyCheckinsDone}/6 concluídos)
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Modo de Autorregulação:</span>
              <button
                onClick={() =>
                  setUserProfile((p: any) => ({
                    ...p,
                    adaptationMode: p.adaptationMode === 'cross_day' ? 'same_day' : 'cross_day'
                  }))
                }
                className="px-2.5 py-0.5 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-bold hover:bg-cyan-500/25 transition-all"
              >
                {userProfile.adaptationMode === 'cross_day'
                  ? 'Adaptar em Dias (Não sobrecarrega o mesmo treino)'
                  : 'Adaptar no Mesmo Treino'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
            {WEEK_DAYS.map((day) => {
              const isSelected = selectedDayIndex === day.index;
              const isChecked = weeklyCheckins[day.index]?.completed;
              const scheduledCode = currentProgram.weeklySchedule[day.index] || 'REST';
              const hasRecommendedBacklog = pendingCrossDayExercises.some(
                (item: any) => item.recommendedDayIndex === day.index
              );

              return (
                <div
                  key={day.index}
                  onClick={() => handleSelectWeekDay(day.index)}
                  className={`relative p-2 sm:p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col items-center sm:items-start justify-between ${isSelected
                    ? 'bg-slate-800/95 border-emerald-500 shadow-lg shadow-emerald-950/30'
                    : isChecked
                      ? 'bg-emerald-950/25 border-emerald-500/35 hover:border-emerald-500/60'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                >
                  <div className="w-full flex items-center justify-between gap-1">
                    <span
                      className={`text-xs font-extrabold ${isSelected ? 'text-white' : 'text-slate-400'
                        }`}
                    >
                      {day.short}
                    </span>
                    <button
                      onClick={(e) => toggleDayCheckin(day.index, e)}
                      title="Marcar / Desmarcar Check-in do dia"
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${isChecked
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </div>

                  <div className="mt-1.5 text-center sm:text-left w-full">
                    <span
                      className={`text-[10px] sm:text-xs font-bold block truncate ${scheduledCode === 'REST' ? 'text-slate-500' : 'text-emerald-300'
                        }`}
                    >
                      {scheduledCode === 'REST' ? 'Cardio/Desc.' : `Treino ${scheduledCode}`}
                    </span>
                    {hasRecommendedBacklog && !isChecked && (
                      <span className="mt-0.5 inline-block px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                        +Reposição
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====================================================================
          GRID PRINCIPAL: VISUALIZADOR 3D ANIMADO + CONTEÚDO DAS ABAS
      ==================================================================== */}
      <main className="max-w-7xl mx-auto px-4 pt-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ------------------------------------------------------------------
            COLUNA ESQUERDA (5 COLUNAS): PERSONAGEM 3D DEMONSTRANDO O EXERCÍCIO
        ------------------------------------------------------------------ */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          <div className="lg:sticky lg:top-20 bg-slate-900/80 backdrop-blur-xl border border-slate-800/90 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 bg-slate-900/95">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Demonstração Biomecânica 3D
                  </h2>
                </div>
                <h3 className="text-sm font-bold text-white mt-0.5 truncate max-w-[260px]">
                  {selectedExercise?.name}
                </h3>
              </div>

              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-semibold">
                <button
                  onClick={() => setVisualizerMode('exercise')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${visualizerMode === 'exercise'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  Exercício
                </button>
                <button
                  onClick={() => setVisualizerMode('split')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${visualizerMode === 'split'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  Ficha
                </button>
                <button
                  onClick={() => setVisualizerMode('debt')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${visualizerMode === 'debt'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  Falta Treinar
                </button>
              </div>
            </div>

            <div className="relative bg-gradient-to-b from-slate-950 via-slate-900/70 to-slate-950">
              <BodyVisualizer3D
                primaryMuscles={highlightedMuscles3D.primary}
                secondaryMuscles={highlightedMuscles3D.secondary}
                debtMuscles={highlightedMuscles3D.debt}
                viewMode={visualizerMode}
                targetCameraAngle={highlightedMuscles3D.cameraAngle}
                animationType={selectedExercise?.animationType || 'incline_press'}
                propType={selectedExercise?.propType || 'dumbbells'}
                exerciseName={selectedExercise?.name || 'Exercício'}
              />
            </div>

            <div className="p-4 bg-slate-950/85 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Equipamento:</span>
                <span className="text-slate-200 font-semibold">{selectedExercise?.equipment}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                <strong className="text-emerald-400">Execução & Dica: </strong>
                {selectedExercise?.notes}
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------
            COLUNA DIREITA (7 COLUNAS): CONTEÚDO DINÂMICO DAS 5 ABAS
        ------------------------------------------------------------------ */}
        <section className="lg:col-span-7 flex flex-col gap-5">
          {/* ================================================================
              ABA 1: TREINO DO DIA & CHECK-IN
          ================================================================ */}
          {activeTab === 'workout' && (
            <div className="space-y-4">
              {/* Banner de Objetivo (Ex: Perder Gordura e Definir) + Seletor de Ficha */}
              <div className="bg-slate-900/85 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      {WEEK_DAYS[selectedDayIndex]?.full} • {currentGoalConfig.badge}
                    </span>
                    <h2 className="text-base sm:text-lg font-extrabold text-white">
                      {currentSplit.code}: {currentSplit.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 flex items-center gap-1.5"
                  >
                    <Target className="w-3.5 h-3.5" />
                    Alterar Meta / Divisão
                  </button>
                </div>

                {/* Seletor rápido de fichas do programa atual */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {Object.values(availableSplits).map((sp: any) => (
                    <button
                      key={sp.id}
                      onClick={() => {
                        setActiveSplitKey(sp.id);
                        if (sp.exercises[0]) setSelectedExerciseId(sp.exercises[0].id);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${validSplitKey === sp.id
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                    >
                      {sp.code}: {sp.title}
                    </button>
                  ))}
                </div>

                {/* Alerta de Adaptação Entre Dias se houver exercícios pendentes */}
                {pendingCrossDayExercises.length > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/35 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <CalendarCheck className="w-4 h-4 text-amber-400 shrink-0" />
                      <p className="text-xs text-amber-200">
                        Você tem <strong>{pendingCrossDayExercises.length} exercício(s)</strong> que
                        faltaram em dias anteriores. Quer repor hoje ou em outro dia?
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('adaptive')}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold"
                    >
                      Ver O Que Falta Treinar →
                    </button>
                  </div>
                )}
              </div>

              {/* Lista de Exercícios da Sessão */}
              <div className="space-y-3.5">
                {sessionExercises.map((exercise: any, exIdx: number) => {
                  const isFocused = selectedExercise?.id === exercise.id;
                  const sets = (sessionSetLogs[exercise.id] || []) as any[];
                  const completedSetsCount = sets.filter((s: any) => s.completed).length;
                  const allCompleted =
                    !exercise.isSkipped && sets.length > 0 && completedSetsCount === sets.length;

                  return (
                    <div
                      key={exercise.id}
                      onClick={() => setSelectedExerciseId(exercise.id)}
                      className={`rounded-2xl border transition-all cursor-pointer overflow-hidden ${exercise.isSkipped
                        ? 'bg-slate-900/30 border-slate-800/60 opacity-60'
                        : isFocused
                          ? 'bg-slate-900/95 border-emerald-500/60 shadow-xl shadow-emerald-950/20'
                          : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
                        }`}
                    >
                      <div className="p-4 flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1 flex-1 min-w-[200px]">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center">
                              {exIdx + 1}
                            </span>
                            <h3 className="text-sm sm:text-base font-bold text-white">
                              {exercise.name}
                            </h3>
                            {allCompleted && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Concluído
                              </span>
                            )}
                            {exercise.isFromBacklog && (
                              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[11px] font-bold">
                                Reposição de {exercise.originDayName}
                              </span>
                            )}
                            {exercise.isSkipped && (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold">
                                Transferido para os Próximos Dias
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
                            {exercise.primaryMuscles.map((m: string) => (
                              <span
                                key={m}
                                className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium"
                              >
                                {MUSCLE_GROUPS[m]?.name}
                              </span>
                            ))}
                            <span>
                              Meta ({currentGoalConfig.name}):{' '}
                              <strong className="text-white">{exercise.displayTargetReps} reps</strong>
                            </span>
                            <span>•</span>
                            <span>Descanso: {exercise.displayRestSeconds}s</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {!exercise.isSkipped && (
                            <button
                              onClick={() => handleSkipExerciseToNextDays(exercise)}
                              className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-amber-500/20 hover:text-amber-300 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-all"
                            >
                              <SkipForward className="w-3.5 h-3.5 text-amber-400" />
                              Deixar p/ Outro Dia
                            </button>
                          )}
                        </div>
                      </div>

                      {!exercise.isSkipped && (
                        <div
                          className="px-4 pb-4 pt-2 border-t border-slate-800/60 space-y-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {sets.map((setItem: any, sIdx: number) => (
                            <div
                              key={sIdx}
                              className={`grid grid-cols-12 items-center gap-2 p-2 rounded-xl border transition-all ${setItem.completed
                                ? 'bg-emerald-950/30 border-emerald-500/40'
                                : 'bg-slate-950/70 border-slate-800/80'
                                }`}
                            >
                              <div className="col-span-2 flex items-center gap-1.5">
                                <span
                                  className={`w-6 h-6 rounded-lg text-xs font-extrabold flex items-center justify-center ${setItem.completed
                                    ? 'bg-emerald-500 text-slate-950'
                                    : 'bg-slate-800 text-slate-400'
                                    }`}
                                >
                                  {setItem.setNumber}
                                </span>
                              </div>

                              <div className="col-span-4 flex items-center justify-center gap-1">
                                <button
                                  onClick={() => updateSetField(exercise.id, sIdx, 'weight', -2, true)}
                                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <div className="flex items-baseline gap-0.5">
                                  <input
                                    type="number"
                                    value={setItem.weight}
                                    onChange={(e) =>
                                      updateSetField(exercise.id, sIdx, 'weight', e.target.value)
                                    }
                                    className="w-12 bg-transparent text-center font-bold text-sm text-white focus:outline-none"
                                  />
                                  <span className="text-[10px] text-slate-400">kg</span>
                                </div>
                                <button
                                  onClick={() => updateSetField(exercise.id, sIdx, 'weight', 2, true)}
                                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="col-span-4 flex items-center justify-center gap-1">
                                <button
                                  onClick={() => updateSetField(exercise.id, sIdx, 'reps', -1, true)}
                                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <div className="flex items-baseline gap-0.5">
                                  <input
                                    type="number"
                                    value={setItem.reps}
                                    onChange={(e) =>
                                      updateSetField(exercise.id, sIdx, 'reps', e.target.value)
                                    }
                                    className="w-10 bg-transparent text-center font-bold text-sm text-white focus:outline-none"
                                  />
                                  <span className="text-[10px] text-slate-400">reps</span>
                                </div>
                                <button
                                  onClick={() => updateSetField(exercise.id, sIdx, 'reps', 1, true)}
                                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="col-span-2 flex justify-end">
                                <button
                                  onClick={() => {
                                    setSelectedExerciseId(exercise.id);
                                    toggleSetCompleted(exercise, sIdx);
                                  }}
                                  className={`w-full sm:w-auto px-3 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${setItem.completed
                                    ? 'bg-emerald-500 text-slate-950'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                    }`}
                                >
                                  <Check className="w-4 h-4 stroke-[2.5]" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Botão de Finalizar e Dar Check-in no Dia */}
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-300">
                  <p className="font-bold text-white">
                    Concluir Check-in de {WEEK_DAYS[selectedDayIndex]?.full}
                  </p>
                  <p className="text-slate-400">
                    Recomendação pós-treino ({currentGoalConfig.name}): {currentGoalConfig.cardioNote}
                  </p>
                </div>
                <button
                  onClick={handleFinishDayWorkout}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  Confirmar Check-in do Dia
                </button>
              </div>
            </div>
          )}

          {/* ================================================================
              ABA 2: CATÁLOGO DE TREINOS & EXERCÍCIOS (COM DEMONSTRAÇÃO 3D)
          ================================================================ */}
          {activeTab === 'catalog' && (
            <div className="space-y-4">
              <div className="bg-slate-900/85 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-emerald-400" />
                      Catálogo Completo de Treinos & Exercícios
                    </h2>
                    <p className="text-xs text-slate-400">
                      Clique em qualquer exercício para ver o personagem 3D demonstrando o movimento
                    </p>
                  </div>
                </div>

                {/* Filtro por Grupo Muscular */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setCatalogMuscleFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${catalogMuscleFilter === 'all'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}
                  >
                    Todos ({allCatalogExercises.length})
                  </button>
                  {Object.values(MUSCLE_GROUPS).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setCatalogMuscleFilter(m.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${catalogMuscleFilter === m.id
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                        }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>

                {/* Lista de Exercícios Filtrados */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {allCatalogExercises
                    .filter(
                      (ex) =>
                        catalogMuscleFilter === 'all' ||
                        ex.primaryMuscles.includes(catalogMuscleFilter) ||
                        ex.secondaryMuscles.includes(catalogMuscleFilter)
                    )
                    .map((ex) => {
                      const isDemoActive = selectedExercise?.name === ex.name;
                      return (
                        <div
                          key={ex.id}
                          onClick={() => {
                            setSelectedExerciseId(ex.id);
                            setVisualizerMode('exercise');
                          }}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-2 ${isDemoActive
                            ? 'bg-emerald-950/30 border-emerald-500 shadow-lg'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                            }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold uppercase text-cyan-400">
                                {ex.equipment}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                                <Play className="w-2.5 h-2.5" /> Demo 3D
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-white mt-1">{ex.name}</h4>
                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                              {ex.notes}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                            <span className="text-emerald-400 font-semibold">
                              Alvo: {ex.primaryMuscles.map((m: string) => MUSCLE_GROUPS[m]?.name).join(', ')}
                            </span>
                            <span className="text-slate-400 font-mono">
                              {ex.baseSets}x {ex.cuttingReps || ex.targetReps}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              ABA 3: O QUE FALTA TREINAR NA SEMANA (ADAPTAÇÃO ENTRE DIAS)
          ================================================================ */}
          {activeTab === 'adaptive' && (
            <div className="space-y-4">
              {/* Painel de Exercícios Pendentes Entre Dias */}
              <div className="bg-slate-900/85 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                      <CalendarCheck className="w-5 h-5 text-amber-400" />
                      Adaptação em Dias: Exercícios Pendentes na Semana
                    </h2>
                    <p className="text-xs text-slate-400">
                      Em vez de sobrecarregar o mesmo treino, o que faltou fica salvo aqui para você
                      encaixar nos próximos dias da semana.
                    </p>
                  </div>
                </div>

                {pendingCrossDayExercises.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="text-sm font-bold text-white">
                      Nenhum exercício pendente de outros dias!
                    </p>
                    <p className="text-xs text-slate-400">
                      Sua programação da semana está 100% em dia.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {pendingCrossDayExercises.map((item: any) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-slate-950/90 border border-amber-500/40 flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                              Faltou em: {item.originDayName}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                              Sugerido para: {WEEK_DAYS[item.recommendedDayIndex]?.full}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white">
                            {item.name} ({item.missedSets} séries pendentes)
                          </h4>
                          <p className="text-xs text-slate-400">{item.notes}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePullBacklogToToday(item)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 transition-all"
                          >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                            Treinar Hoje ({WEEK_DAYS[selectedDayIndex]?.short})
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Painel Visual: O Que Falta Treinar por Grupo Muscular na Semana */}
              <div className="bg-slate-900/85 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Resumo Semanal: O Que Falta Treinar por Grupo Muscular
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {missingVolumeSummary.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => {
                        setVisualizerMode('debt');
                      }}
                      className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{m.name}</span>
                        {m.remaining > 0 ? (
                          <span className="text-amber-400 font-bold">
                            Faltam {m.remaining} séries
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Meta Batida!
                          </span>
                        )}
                      </div>
                      <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                          style={{ width: `${m.pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Concluído: {m.done} séries</span>
                        <span>Meta Semanal: {m.WeeklyTarget} séries</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              ABA 4: EVOLUÇÃO DE PESO MENSAL & VOLUME
          ================================================================ */}
          {activeTab === 'progress' && (
            <div className="space-y-4">
              {/* Painel de Evolução de Peso Mensal */}
              <div className="bg-slate-900/85 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                      <Scale className="w-5 h-5 text-emerald-400" />
                      Evolução de Peso Mensal & Composição Corporal
                    </h2>
                    <p className="text-xs text-slate-400">
                      Acompanhe sua redução de gordura rumo à meta de{' '}
                      <strong className="text-emerald-400">{userProfile.targetWeightKg} kg</strong>
                    </p>
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-right">
                    <span className="text-[10px] uppercase font-bold text-emerald-300 block">
                      Distância para a Meta
                    </span>
                    <span className="text-sm font-extrabold text-white">
                      {weightDifferenceToGoal > 0
                        ? `Faltam -${weightDifferenceToGoal} kg`
                        : 'Meta Alcançada!'}
                    </span>
                  </div>
                </div>

                {/* Gráfico Visual das Pesagens Mensais */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                  {monthlyWeightLogs.map((entry: any, idx: number) => {
                    const prevWeight =
                      idx > 0 ? monthlyWeightLogs[idx - 1].weight : entry.weight;
                    const delta = (entry.weight - prevWeight).toFixed(1);
                    return (
                      <div
                        key={entry.id}
                        className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-cyan-400 uppercase">
                            {entry.month}
                          </span>
                          {idx > 0 && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${Number(delta) <= 0
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-amber-500/20 text-amber-300'
                                }`}
                            >
                              {Number(delta) > 0 ? `+${delta}` : delta} kg
                            </span>
                          )}
                        </div>
                        <div className="my-2">
                          <span className="text-xl font-extrabold text-white">
                            {entry.weight} <small className="text-xs text-slate-400">kg</small>
                          </span>
                          <span className="block text-[11px] text-emerald-400 font-semibold">
                            BF est.: {entry.bodyFat}%
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">{entry.note}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Formulário para Adicionar Pesagem do Mês */}
                <form
                  onSubmit={handleAddMonthlyWeight}
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-end"
                >
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      Mês
                    </label>
                    <input
                      type="text"
                      value={newMonthName}
                      onChange={(e) => setNewMonthName(e.target.value)}
                      placeholder="Ex: Out"
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      Peso (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newMonthWeight}
                      onChange={(e) => setNewMonthWeight(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      Gordura % (Opcional)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newMonthBodyFat}
                      onChange={(e) => setNewMonthBodyFat(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      Observação
                    </label>
                    <input
                      type="text"
                      value={newMonthNote}
                      onChange={(e) => setNewMonthNote(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs h-[34px]"
                  >
                    + Salvar Mês
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ================================================================
              ABA 5: CONFIGURAÇÃO DE OBJETIVO, PESO, META E DIVISÃO DE TREINO
          ================================================================ */}
          {activeTab === 'profile' && (
            <div className="bg-slate-900/85 border border-slate-800 rounded-2xl p-5 space-y-5">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-400" />
                  Personalizar Objetivo, Peso Atual, Meta & Divisão de Treino
                </h2>
                <p className="text-xs text-slate-400">
                  O Workout OS ajusta automaticamente as faixas de repetições, intervalos de
                  descanso e calendário semanal conforme suas escolhas.
                </p>
              </div>

              {/* 1. Peso Atual e Meta de Peso */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">
                    Quantos kg você tem hoje? (Peso Atual)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      value={userProfile.currentWeightKg}
                      onChange={(e) =>
                        setUserProfile((p: any) => ({
                          ...p,
                          currentWeightKg: parseFloat(e.target.value) || 0
                        }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-lg font-extrabold text-white"
                    />
                    <span className="text-sm font-bold text-slate-400">kg</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <label className="text-xs font-bold text-emerald-400 block">
                    Qual é a sua Meta de Peso? (kg)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      value={userProfile.targetWeightKg}
                      onChange={(e) =>
                        setUserProfile((p: any) => ({
                          ...p,
                          targetWeightKg: parseFloat(e.target.value) || 0
                        }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-emerald-500/50 text-lg font-extrabold text-emerald-400"
                    />
                    <span className="text-sm font-bold text-slate-400">kg</span>
                  </div>
                </div>
              </div>

              {/* 2. Escolha do Objetivo Principal */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Qual é o seu Objetivo Principal?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Object.values(TRAINING_GOALS).map((g: any) => {
                    const selected = userProfile.goal === g.id;
                    return (
                      <button
                        key={g.id}
                        onClick={() => setUserProfile((p: any) => ({ ...p, goal: g.id }))}
                        className={`p-3.5 rounded-xl border text-left transition-all ${selected
                          ? 'bg-emerald-500/15 border-emerald-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                      >
                        <p className="text-xs font-extrabold text-emerald-400">{g.name}</p>
                        <p className="text-[11px] text-slate-300 mt-1">{g.repMultiplierLabel}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{g.cardioNote}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Escolha da Divisão de Treino (ABC, Upper/Lower, Full Body) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Qual Divisão de Treino você prefere seguir na semana?
                </label>
                <div className="grid grid-cols-1 gap-2.5">
                  {Object.values(SPLIT_PROGRAMS).map((prog: any) => {
                    const selected = userProfile.splitSystem === prog.id;
                    return (
                      <button
                        key={prog.id}
                        onClick={() => {
                          const firstKey = Object.keys(prog.splits)[0];
                          setUserProfile((p: any) => ({ ...p, splitSystem: prog.id }));
                          setActiveSplitKey(firstKey);
                          if ((prog.splits as Record<string, any>)[firstKey]?.exercises[0]) {
                            setSelectedExerciseId((prog.splits as Record<string, any>)[firstKey].exercises[0].id);
                          }
                          showNotification(
                            `Divisão alterada para ${prog.id}`,
                            `Seu calendário de Check-in Semanal e suas fichas foram atualizados!`
                          );
                        }}
                        className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between gap-3 ${selected
                          ? 'bg-cyan-500/15 border-cyan-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                      >
                        <div>
                          <p className="text-sm font-extrabold text-white">{prog.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{prog.description}</p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-bold ${selected ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                            }`}
                        >
                          {selected ? 'Ativo' : 'Selecionar'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* ====================================================================
          BARRA DE NAVEGAÇÃO INFERIOR (MOBILE-FIRST)
      ==================================================================== */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 px-2 py-2 flex items-center justify-around">
        {[
          { id: 'workout', label: 'Treino', icon: Dumbbell },
          { id: 'catalog', label: 'Exercícios', icon: BookOpen },
          {
            id: 'adaptive',
            label: 'Falta Treinar',
            icon: CalendarCheck,
            badge: pendingCrossDayExercises.length
          },
          { id: 'progress', label: 'Peso Mensal', icon: Scale },
          { id: 'profile', label: 'Objetivo', icon: Target }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-2.5 py-1.5 rounded-xl flex flex-col items-center gap-0.5 text-[10px] font-semibold transition-all ${isActive ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400'
                }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {Boolean(tab.badge && tab.badge > 0) && (
                <span className="absolute -top-1 right-1 px-1.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-extrabold">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}