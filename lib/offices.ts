export interface Office {
  slug: string;
  /** Full label as listed, e.g. "Austin (400 W 6th)" */
  name: string;
  /** City only, e.g. "Austin" */
  city: string;
  state: string;
  address: string;
  zip: string;
  phone: string | null;
  /** Short catalog code, e.g. "FP" */
  code: string;
}

type RawOffice = [
  name: string,
  state: string,
  address: string,
  zip: string,
  phone: string,
  code?: string,
];

const RAW: RawOffice[] = [
  ["Albany", "NY", "12 Corporate Woods Boulevard", "12211", "+1 (518) 433-4300"],
  ["Atlanta", "GA", "1075 Peachtree Street NE, Suite 2600", "30309", "+1 (678) 419-1000"],
  ["Austin (400 W 6th)", "TX", "400 W. 6th Street, Suite 31000", "78701", ""],
  ["Austin (835 W 6th)", "TX", "835 West 6th Street, Suite 1600", "78703", ""],
  ["Baltimore", "MD", "301 Mission Boulevard", "21230", "+1 (410) 783-7600"],
  ["Bentonville", "AR", "240 S. Main Street, Suite 286", "72712", "+1 (479) 469-8220"],
  ["Birmingham", "AL", "569 Brookwood Village, Suite 851", "35209", "+1 (205) 414-4000"],
  ["Boca Raton", "FL", "5100 Town Center Circle, Suite 600", "33486", "+1 (561) 268-0575"],
  ["Boston", "MA", "101 Seaport Boulevard, Suite 500", "02210", "+1 (617) 530-5000"],
  ["Buffalo", "NY", "726 Exchange Street, Suite 1010", "14210", "+1 (716) 856-4650"],
  ["Charlotte", "NC", "214 North Tryon Street, Suite 4200", "28202", "+1 (704) 344-7500"],
  ["Chicago", "IL", "One North Wacker Drive", "60606", "+1 (312) 298-2000"],
  ["Cincinnati", "OH", "201 East Fifth Street, Suite 2400 & Portion of Suite 2300", "45202", "+1 (513) 723-4700"],
  ["Cleveland", "OH", "200 Public Square, Suite 1900", "44114", "+1 (216) 875-3000"],
  ["Columbia", "SC", "1333 Main Street, Suite 300", "29201", ""],
  ["Columbus", "OH", "41 South High Street, Suite 2500", "43215", "+1 (614) 225-8700"],
  ["Dallas", "TX", "2121 N. Pearl Street, Suite 2000", "75201", "+1 (214) 999-1400"],
  ["Denver", "CO", "1900 Sixteenth Street", "80202", "+1 (720) 931-7000"],
  ["Des Moines", "IA", "699 Walnut Street", "50309", "+1 (515) 246-3800"],
  ["Detroit", "MI", "500 Woodward Avenue", "48226", "+1 (313) 394-6000"],
  ["El Segundo", "CA", "840 Apollo St, Suite 100", "90245", "+1 (213) 356-6000"],
  ["Fairport (Rochester Area)", "NY", "300 WillowBrook Office Park, Suite 300", "14450", ""],
  ["Fayetteville / Springdale", "AR", "4100 Corporate Center Drive, Suite 401", "72762", "+1 (479) 587-3430"],
  ["Florham Park", "NJ", "400 Campus Drive", "07932", "+1 (973) 236-4000", "FP"],
  ["Fort Worth", "TX", "301 Commerce Street, Suite 2350", "76102", "+1 (817) 810-9998"],
  ["Grand Rapids", "MI", "80 Ottawa Ave N.W., Suite 320", "49503", "+1 (616) 356-6900"],
  ["Greensboro", "NC", "400 Bellemeade Street, Suite 402", "27401", "+1 (336) 665-2700"],
  ["Hartford", "CT", "185 Asylum Street, Suite 2400", "06103", "+1 (860) 241-7000"],
  ["Houston", "TX", "1000 Louisiana Street, Suite 5800", "77002", "+1 (713) 356-4000"],
  ["Indianapolis", "IN", "One American Square, Suite 2100", "46282", "+1 (317) 222-2202"],
  ["Irvine (Orange County)", "CA", "2020 Main Street, Suite 400", "92614", "+1 (949) 437-5200"],
  ["Jacksonville", "FL", "76 Laura Street, Suite 2100", "32202", "+1 (904) 354-0671"],
  ["Kansas City", "MO", "1100 Walnut Street, Suite 1300", "64106", "+1 (816) 472-7921"],
  ["Las Vegas", "NV", "1980 Festival Park Drive, Suite 520", "89135", "+1 (702) 691-5400"],
  ["Little Rock", "AR", "900 South Shackleford Road, Suite 600", "72211", "+1 (501) 907-8080"],
  ["Los Angeles", "CA", "601 South Figueroa Street, Suite 900", "90017", "+1 (213) 356-6000"],
  ["Louisville", "KY", "750 E Jefferson Street, Suite 301", "40202", "+1 (502) 589-6100"],
  ["Melville", "NY", "401 Broadhollow Road", "11747", "+1 (631) 753-2700"],
  ["Miami", "FL", "545 NW 26th Street, Suite 800", "33127", "+1 (305) 375-7400"],
  ["Milwaukee", "WI", "833 East Michigan Street, Suite 1200", "53202", "+1 (414) 212-1600"],
  ["Minneapolis", "MN", "45 South 7th Street, Suite 3400", "55402", "+1 (612) 596-6000"],
  ["Montpelier", "VT", "One National Life Drive", "05604", "+1 (802) 229-7553"],
  ["Nashville", "TN", "21 Platform Way South, Suite 1900", "37203", "+1 (615) 503-2860"],
  ["New Orleans", "LA", "909 Poydras Street, Suite 3100", "70112", "+1 (504) 558-8200"],
  ["New York (Madison Ave)", "NY", "300 Madison Avenue", "10017", "+1 (646) 471-3000", "NYC"],
  ["New York (Park Ave)", "NY", "90 Park Avenue, Suite 400", "10016", "+1 (646) 818-6000", "NYP"],
  ["Oklahoma City", "OK", "424 NW 10th Street, Suite 201", "73103", "+1 (405) 290-7200"],
  ["Orlando", "FL", "420 S Orange Avenue, Suite 200", "32801", "+1 (407) 392-9051"],
  ["Philadelphia", "PA", "2001 Market Street, Suite 1800", "19103", "+1 (267) 330-3000"],
  ["Phoenix", "AZ", "4300 E. Camelback Road, Suite 475", "85018", "+1 (602) 364-8000"],
  ["Pittsburgh", "PA", "301 Grant Street, Suite 4500", "15219", "+1 (412) 355-6000"],
  ["Portland", "OR", "1140 SW Washington Street, Suite 400", "97205", "+1 (971) 544-4000"],
  ["Raleigh (Center at North Hills)", "NC", "4114 Center at North Hills St., Suite 500", "27609", "+1 (919) 791-4000"],
  ["Raleigh (Six Forks Rd)", "NC", "4208 Six Forks Road, Suite 1200", "27609", ""],
  ["Richmond", "VA", "2230 West Broad Street, Suite 301", "23220", "+1 (512) 957-8600"],
  ["Rosemont", "IL", "9399 West Higgins Rd, Suite 900", "60018", "+1 (847) 430-9000"],
  ["Sacramento", "CA", "400 Capitol Mall, Suite 1425", "95814", "+1 (916) 930-8100"],
  ["Salt Lake City", "UT", "201 South Main Street, Suite 900", "84111", "+1 (801) 531-9666"],
  ["San Antonio", "TX", "200 Concord Plaza, Suite 550", "78216", "+1 (210) 640-8000"],
  ["San Diego (12790 El Camino)", "CA", "12790 El Camino Real, Suite 100", "92130", ""],
  ["San Diego (12860 El Camino)", "CA", "12860 El Camino Real, Suite 250", "92130", ""],
  ["San Francisco (Howard St)", "CA", "405 Howard Street, Suite 600", "94105", "+1 (415) 498-5000", "SFR"],
  ["San Francisco (Embarcadero)", "CA", "Three Embarcadero Center", "94111", "", "SFE"],
  ["San Jose (Silicon Valley)", "CA", "3155 Olsen Drive, Suite 700", "95117", "+1 (408) 817-3700"],
  ["San Juan", "PR", "304 Ponce de Leon Avenue, Suite 800", "00918", ""],
  ["Seattle", "WA", "1420 Fifth Avenue, Suite 2800", "98101", "+1 (206) 398-3000"],
  ["Spartanburg", "SC", "320 East Main Street, Suite 420", "29302", "+1 (864) 577-8810"],
  ["St. Louis", "MO", "6 Cardinal Way, Suite 1100", "63102", "+1 (314) 206-8500"],
  ["Stamford", "CT", "263 Tresser Boulevard, Suite 800", "06901", "+1 (203) 539-3000"],
  ["Tampa", "FL", "4040 West Boy Scout Boulevard, 10th Floor", "33607", "+1 (813) 229-0221"],
  ["Toledo", "OH", "100 N Summit St, Suite 200", "43604", "+1 (419) 254-2500"],
  ["Tulsa", "OK", "6120 South Yale Avenue, Suite 1850", "74136", "+1 (918) 524-1200"],
  ["Victor (Rochester Area)", "NY", "207 High Point Drive, Suite 210", "14564", ""],
  ["Washington, D.C.", "DC", "655 New York Ave NW", "20001", "+1 (202) 414-1000"],
];

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** "San Jose (Silicon Valley)" -> "SJO": city initials, padded from the last word. */
function deriveCode(name: string): string {
  const city = name.split("(")[0].replace(/[.,]/g, " ").trim();
  const words = city.split(/\s+/).filter((word) => /[a-z]/i.test(word));
  const initials = words.map((word) => word[0].toUpperCase()).join("");
  if (initials.length >= 3) return initials.slice(0, 3);
  const last = (words[words.length - 1] ?? "ofc").toUpperCase();
  return (initials + last.slice(1)).slice(0, 3).padEnd(3, "X");
}

function buildOffices(raw: RawOffice[]): Office[] {
  const seen = new Map<string, number>();
  return raw.map(([name, state, address, zip, phone, override]) => {
    const base = override ?? deriveCode(name);
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return {
      slug: slugify(name),
      name,
      city: name.split(" (")[0],
      state,
      address,
      zip,
      phone: phone.trim() === "" ? null : phone,
      code: count === 1 ? base : `${base}${count}`,
    };
  });
}

export const offices: Office[] = buildOffices(RAW);

export const officeBySlug = new Map(offices.map((office) => [office.slug, office]));

export function getOffice(slug: string): Office | undefined {
  return officeBySlug.get(slug);
}

/**
 * The shelf that belongs to the whole company rather than any one office.
 * It is not in `offices`, so it never shows up as a folder.
 */
export const COMPANY_SLUG = "company";

export const COMPANY: Office = {
  slug: COMPANY_SLUG,
  name: "Whole company",
  city: "Company-wide",
  state: "",
  address: "",
  zip: "",
  phone: null,
  code: "ALL",
};

/** The office (or the company) that keeps a shelf. */
export function shelfOwner(slug: string): Office | undefined {
  return slug === COMPANY_SLUG ? COMPANY : officeBySlug.get(slug);
}

/** Offices that keep a full shelf, per the brief. */
export const BIG_OFFICE_SLUGS = new Set([
  "florham-park",
  "new-york-madison-ave",
  "new-york-park-ave",
]);
