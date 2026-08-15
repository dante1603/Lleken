export type PlantTabId = 'today' | 'care' | 'history' | 'settings';

export type PlantsViewState = {
  searchQuery: string;
  activeFilter: 'todas' | 'revisar';
  sortBy: 'reciente' | 'nombre';
};

export type CalendarViewState = {
  selectedDate: string;
  monthDate: string;
};

export type NavigationOrigin =
  | { surface: 'home' }
  | { surface: 'plants'; view: PlantsViewState }
  | { surface: 'calendar'; view: CalendarViewState };

export type NavigationParent = 'origin' | 'plant';

export type FlowNavigation = {
  origin: NavigationOrigin;
  parent?: NavigationParent;
  plantTab?: PlantTabId;
};

const PLANT_TABS: readonly PlantTabId[] = ['today', 'care', 'history', 'settings'];
const PLANT_FILTERS = ['todas', 'revisar'] as const;
const PLANT_SORTS = ['reciente', 'nombre'] as const;
const NAVIGATION_PARENTS: readonly NavigationParent[] = ['origin', 'plant'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOneOf<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === 'string' && values.includes(value as T);
}

function readPlantsView(value: unknown): PlantsViewState | undefined {
  if (!isRecord(value)) return undefined;

  const { searchQuery, activeFilter, sortBy } = value;
  if (typeof searchQuery !== 'string'
    || !isOneOf(activeFilter, PLANT_FILTERS)
    || !isOneOf(sortBy, PLANT_SORTS)) {
    return undefined;
  }

  return { searchQuery, activeFilter, sortBy };
}

export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function readCalendarView(value: unknown): CalendarViewState | undefined {
  if (!isRecord(value)) return undefined;

  const { selectedDate, monthDate } = value;
  if (!isCalendarDate(selectedDate) || !isCalendarDate(monthDate)) return undefined;

  return { selectedDate, monthDate };
}

function readOrigin(value: unknown): NavigationOrigin | undefined {
  if (!isRecord(value)) return undefined;

  if (value.surface === 'home') return { surface: 'home' };
  if (value.surface === 'plants') {
    const view = readPlantsView(value.view);
    return view ? { surface: 'plants', view } : undefined;
  }
  if (value.surface === 'calendar') {
    const view = readCalendarView(value.view);
    return view ? { surface: 'calendar', view } : undefined;
  }

  return undefined;
}

export function readNavigation(state: unknown): FlowNavigation | undefined {
  if (!isRecord(state) || !isRecord(state.navigation)) return undefined;

  const origin = readOrigin(state.navigation.origin);
  if (!origin) return undefined;

  const { parent, plantTab } = state.navigation;
  const parsedParent = parent === undefined ? undefined : isOneOf(parent, NAVIGATION_PARENTS) ? parent : undefined;
  const parsedPlantTab = plantTab === undefined ? undefined : isOneOf(plantTab, PLANT_TABS) ? plantTab : undefined;
  if (parent !== undefined && !parsedParent) return undefined;
  if (plantTab !== undefined && !parsedPlantTab) return undefined;

  return {
    origin,
    ...(parsedParent ? { parent: parsedParent } : {}),
    ...(parsedPlantTab ? { plantTab: parsedPlantTab } : {}),
  };
}

export function homeNavigation(): FlowNavigation {
  return { origin: { surface: 'home' } };
}

export function getOriginRoute(navigation: Pick<FlowNavigation, 'origin'> | undefined): string {
  switch (navigation?.origin.surface) {
    case 'plants':
      return '/plants';
    case 'calendar':
      return '/calendar';
    case 'home':
    default:
      return '/home';
  }
}

export function toPlantChildNavigation(navigation: FlowNavigation, plantTab?: PlantTabId): FlowNavigation {
  const nextPlantTab = plantTab ?? navigation.plantTab;
  return {
    origin: navigation.origin,
    parent: 'plant',
    ...(nextPlantTab ? { plantTab: nextPlantTab } : {}),
  };
}

export function toOriginChildNavigation(origin: NavigationOrigin): FlowNavigation {
  return { origin, parent: 'origin' };
}

export function toPlantNavigation(navigation: FlowNavigation): FlowNavigation {
  return {
    origin: navigation.origin,
    ...(navigation.plantTab ? { plantTab: navigation.plantTab } : {}),
  };
}

export function toOriginNavigation(navigation: FlowNavigation): FlowNavigation {
  return { origin: navigation.origin };
}

export function withNavigation<T extends Record<string, unknown>>(payload: T, navigation: FlowNavigation): T & { navigation: FlowNavigation } {
  return { ...payload, navigation };
}
