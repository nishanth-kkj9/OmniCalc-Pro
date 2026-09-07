"""
Date & Time Engine for OmniCalc Pro.
Provides pure, standard-library-based date arithmetic, working day computation,
age/birthday analysis, and work hours/wage tracking.
"""
from __future__ import annotations
from dataclasses import dataclass
import datetime
from typing import Optional, Tuple, Union


@dataclass
class DateDiffResult:
    total_days: int
    total_weeks: int
    rem_days: int
    work_days: int
    years: int
    months: int
    days: int
    total_hours: int
    total_minutes: int
    total_seconds: int

    def summary_text(self) -> str:
        return (
            f"Calendar Difference: {self.total_days} days\n"
            f"Weeks & Days: {self.total_weeks} weeks, {self.rem_days} days\n"
            f"Business / Working Days: {self.work_days} days\n"
            f"Breakdown: {self.years} years, {self.months} months, {self.days} days\n"
            f"Total Hours: {self.total_hours:,}\n"
            f"Total Minutes: {self.total_minutes:,}\n"
            f"Total Seconds: {self.total_seconds:,}"
        )


@dataclass
class AddSubResult:
    result_date: datetime.date
    iso_date: str
    formatted_date: str
    operation: str
    years_offset: int
    months_offset: int
    weeks_offset: int
    days_offset: int

    def summary_text(self) -> str:
        return (
            f"Result Date: {self.iso_date}\n"
            f"Formatted: {self.formatted_date}\n"
            f"Operation: {self.operation.title()}\n"
            f"Offsets: {self.years_offset}y, {self.months_offset}m, {self.weeks_offset}w, {self.days_offset}d"
        )


@dataclass
class AgeResult:
    years: int
    months: int
    days: int
    total_days_lived: int
    days_until_next_bday: int
    next_bday_date: datetime.date
    next_bday_formatted: str
    age_str: str

    def summary_text(self) -> str:
        return (
            f"Age: {self.age_str}\n"
            f"Total Days Lived: {self.total_days_lived:,}\n"
            f"Days Until Next Birthday: {self.days_until_next_bday}\n"
            f"Next Birthday: {self.next_bday_formatted} ({self.next_bday_date.isoformat()})"
        )


@dataclass
class WorkHoursResult:
    total_span_minutes: int
    break_minutes: int
    net_minutes: int
    full_hours: int
    rem_minutes: int
    net_time_str: str
    decimal_hours: float
    hourly_rate: float
    earnings: float
    is_overnight: bool

    def summary_text(self) -> str:
        overnight_tag = " (Overnight Shift)" if self.is_overnight else ""
        return (
            f"Net Working Time: {self.net_time_str}{overnight_tag}\n"
            f"Decimal Hours: {self.decimal_hours:.2f} hrs\n"
            f"Hourly Rate: ${self.hourly_rate:.2f}\n"
            f"Total Earnings: ${self.earnings:,.2f}\n"
            f"Total Shift Span: {self.total_span_minutes // 60}h {self.total_span_minutes % 60}m\n"
            f"Unpaid Break: {self.break_minutes} mins"
        )


class DateTimeEngine:
    """Core computational engine for Date & Time calculations."""

    @staticmethod
    def parse_date(value: Union[str, datetime.date, datetime.datetime]) -> datetime.date:
        """Parse string (YYYY-MM-DD) or extract date from date/datetime objects."""
        if isinstance(value, datetime.datetime):
            return value.date()
        if isinstance(value, datetime.date):
            return value
        if not isinstance(value, str):
            raise ValueError(f"Expected date string or date object, got {type(value).__name__}")
        
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Date string cannot be empty")
        
        # Support YYYY-MM-DD
        try:
            return datetime.date.fromisoformat(cleaned)
        except ValueError:
            pass

        # Support MM/DD/YYYY and other common formats
        for fmt in ("%m/%d/%Y", "%d/%m/%Y", "%Y/%m/%d", "%d-%m-%Y"):
            try:
                return datetime.datetime.strptime(cleaned, fmt).date()
            except ValueError:
                continue

        raise ValueError(f"Unable to parse date string: '{value}'. Expected YYYY-MM-DD.")

    @staticmethod
    def date_difference(
        start_date: Union[str, datetime.date],
        end_date: Union[str, datetime.date]
    ) -> DateDiffResult:
        """
        Compute calendar and working day difference between two dates.
        Working days: Monday through Friday (inclusive of start and end points).
        Breakdown: Years, months, and days with accurate calendar-borrow logic.
        """
        d1 = DateTimeEngine.parse_date(start_date)
        d2 = DateTimeEngine.parse_date(end_date)

        early = min(d1, d2)
        late = max(d1, d2)

        total_days = (late - early).days
        total_weeks = total_days // 7
        rem_days = total_days % 7
        total_hours = total_days * 24
        total_minutes = total_hours * 60
        total_seconds = total_minutes * 60

        # Working days count (Monday=0 ... Sunday=6; weekday < 5 is Mon-Fri)
        # Consistent with web: counts days where cur <= target
        work_days = 0
        cur = early
        one_day = datetime.timedelta(days=1)
        while cur <= late:
            if cur.weekday() < 5:
                work_days += 1
            cur += one_day

        # Breakdown (Years, Months, Days)
        y = late.year - early.year
        m = late.month - early.month
        d = late.day - early.day

        if d < 0:
            m -= 1
            first_of_late_month = datetime.date(late.year, late.month, 1)
            last_of_prev_month = first_of_late_month - one_day
            d += last_of_prev_month.day

        if m < 0:
            y -= 1
            m += 12

        return DateDiffResult(
            total_days=total_days,
            total_weeks=total_weeks,
            rem_days=rem_days,
            work_days=work_days,
            years=y,
            months=m,
            days=d,
            total_hours=total_hours,
            total_minutes=total_minutes,
            total_seconds=total_seconds,
        )

    @staticmethod
    def add_subtract_date(
        base_date: Union[str, datetime.date],
        operation: str,
        years: int = 0,
        months: int = 0,
        weeks: int = 0,
        days: int = 0
    ) -> AddSubResult:
        """
        Add or subtract years, months, weeks, and days from base_date.
        Preserves month boundaries and rollover semantics matching web implementation.
        """
        b_date = DateTimeEngine.parse_date(base_date)

        op = operation.strip().lower()
        if op in ("add", "+", "plus"):
            mult = 1
            clean_op = "add"
        elif op in ("subtract", "-", "sub", "minus"):
            mult = -1
            clean_op = "subtract"
        else:
            raise ValueError(f"Invalid operation '{operation}'. Expected 'add' or 'subtract'.")

        if years < 0 or months < 0 or weeks < 0 or days < 0:
            raise ValueError("Year, month, week, and day offsets must be non-negative integers.")

        # Year and month calculation
        target_y = b_date.year + mult * years
        m_idx = (b_date.month - 1) + mult * months
        target_y += m_idx // 12
        target_m = (m_idx % 12) + 1

        # Matching JS Date setFullYear/setMonth behavior:
        # Starting from 1st of target month, advance by (day - 1) days
        res = datetime.date(target_y, target_m, 1) + datetime.timedelta(days=b_date.day - 1)
        res += datetime.timedelta(days=mult * (weeks * 7 + days))

        formatted = res.strftime("%A, %B %d, %Y")

        return AddSubResult(
            result_date=res,
            iso_date=res.isoformat(),
            formatted_date=formatted,
            operation=clean_op,
            years_offset=years,
            months_offset=months,
            weeks_offset=weeks,
            days_offset=days,
        )

    @staticmethod
    def age_and_birthday(
        birth_date: Union[str, datetime.date],
        as_of: Optional[Union[str, datetime.date]] = None
    ) -> AgeResult:
        """
        Calculate precise age in years, months, and days, total days lived,
        and days until the next birthday.
        """
        dob = DateTimeEngine.parse_date(birth_date)
        now = DateTimeEngine.parse_date(as_of) if as_of is not None else datetime.date.today()

        if dob > now:
            raise ValueError("Birth date cannot be in the future relative to comparison date.")

        one_day = datetime.timedelta(days=1)

        y = now.year - dob.year
        m = now.month - dob.month
        d = now.day - dob.day

        if d < 0:
            m -= 1
            first_of_now_month = datetime.date(now.year, now.month, 1)
            last_of_prev_month = first_of_now_month - one_day
            d += last_of_prev_month.day

        if m < 0:
            y -= 1
            m += 12

        total_days_lived = (now - dob).days

        # Next birthday determination
        def get_bday_date(year: int, month: int, day: int) -> datetime.date:
            try:
                return datetime.date(year, month, day)
            except ValueError:
                # Feb 29 in non-leap year rolls to March 1 (identical to JS Date)
                if month == 2 and day == 29:
                    return datetime.date(year, 3, 1)
                raise

        candidate_bday = get_bday_date(now.year, dob.month, dob.day)
        if candidate_bday < now:
            next_bday = get_bday_date(now.year + 1, dob.month, dob.day)
        else:
            next_bday = candidate_bday

        days_until_next_bday = (next_bday - now).days
        next_bday_formatted = next_bday.strftime("%A, %B %d, %Y")
        age_str = f"{y} Years, {m} Months, {d} Days"

        return AgeResult(
            years=y,
            months=m,
            days=d,
            total_days_lived=total_days_lived,
            days_until_next_bday=days_until_next_bday,
            next_bday_date=next_bday,
            next_bday_formatted=next_bday_formatted,
            age_str=age_str,
        )

    @staticmethod
    def parse_time_to_minutes(time_str: str) -> int:
        """Parse HH:MM into total minutes from midnight (0..1439)."""
        cleaned = time_str.strip()
        if not cleaned:
            raise ValueError("Time string cannot be empty")
        parts = cleaned.split(":")
        if len(parts) != 2:
            raise ValueError(f"Invalid time format '{time_str}'. Expected HH:MM (e.g. 09:00).")
        try:
            h = int(parts[0])
            m = int(parts[1])
        except ValueError:
            raise ValueError(f"Non-numeric time values in '{time_str}'.")

        if not (0 <= h <= 23) or not (0 <= m <= 59):
            raise ValueError(f"Time values out of range in '{time_str}'. Hours must be 0-23, minutes 0-59.")

        return h * 60 + m

    @staticmethod
    def work_hours_and_wage(
        work_start: str,
        work_end: str,
        break_minutes: int = 0,
        hourly_rate: float = 0.0
    ) -> WorkHoursResult:
        """
        Calculate net working hours and wage from start time, end time,
        unpaid break minutes, and hourly rate.
        Supports overnight shifts where end_time < start_time.
        """
        start_mins = DateTimeEngine.parse_time_to_minutes(work_start)
        end_mins = DateTimeEngine.parse_time_to_minutes(work_end)

        is_overnight = False
        if end_mins < start_mins:
            end_mins += 24 * 60
            is_overnight = True

        if break_minutes < 0:
            raise ValueError("Break minutes cannot be negative.")
        if hourly_rate < 0:
            raise ValueError("Hourly rate cannot be negative.")

        total_span_minutes = end_mins - start_mins
        net_minutes = max(0, total_span_minutes - break_minutes)
        net_hours = net_minutes / 60.0
        earnings = net_hours * hourly_rate

        full_hours = net_minutes // 60
        rem_minutes = net_minutes % 60
        net_time_str = f"{full_hours}h {rem_minutes}m"

        return WorkHoursResult(
            total_span_minutes=total_span_minutes,
            break_minutes=break_minutes,
            net_minutes=net_minutes,
            full_hours=full_hours,
            rem_minutes=rem_minutes,
            net_time_str=net_time_str,
            decimal_hours=round(net_hours, 2),
            hourly_rate=hourly_rate,
            earnings=round(earnings, 2),
            is_overnight=is_overnight,
        )
