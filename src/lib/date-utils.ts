import { addDays, addWeeks, format, startOfWeek } from "date-fns";

export const WEEKDAY_SHORT = ["월", "화", "수", "목", "금", "토", "일"];
export const WEEKDAY_FULL = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"];

export function todayStr(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/** 월요일 시작 기준, offset주 만큼 이동한 7일의 날짜 문자열 배열 */
export function weekDatesForOffset(offset: number): string[] {
  const monday = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), offset);
  return Array.from({ length: 7 }, (_, i) => format(addDays(monday, i), "yyyy-MM-dd"));
}

export function weekRangeLabel(offset: number): string {
  const dates = weekDatesForOffset(offset);
  const first = new Date(dates[0] + "T00:00:00");
  const last = new Date(dates[6] + "T00:00:00");
  return `${first.getMonth() + 1}월 ${first.getDate()}일 - ${last.getMonth() + 1}월 ${last.getDate()}일`;
}

export function dayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const idx = (d.getDay() + 6) % 7;
  const suffix = dateStr === todayStr() ? " (오늘)" : "";
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAY_FULL[idx]}${suffix}`;
}
