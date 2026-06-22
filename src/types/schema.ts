export interface Thing {
  "@context"?: string;
  "@type": string;
  name?: string;
  description?: string;
  image?: string | string[] | ImageObject | ImageObject[];
  url?: string;
  identifier?: string | PropertyValue;
}

export interface ImageObject extends Thing {
  "@type": "ImageObject";
  url: string;
  width?: number | QuantitativeValue;
  height?: number | QuantitativeValue;
}

export interface QuantitativeValue extends Thing {
  "@type": "QuantitativeValue";
  value?: number | string | boolean;
  unitCode?: string;
  unitText?: string;
  minValue?: number;
  maxValue?: number;
}

export interface PropertyValue extends Thing {
  "@type": "PropertyValue";
  value: string | number | boolean;
  propertyID?: string;
}

export interface Place extends Thing {
  "@type": "Place";
  address?: string | PostalAddress;
  geo?: GeoCoordinates;
  hasMap?: string;
  telephone?: string;
}

export interface GeoCoordinates extends Thing {
  "@type": "GeoCoordinates";
  latitude: number | string;
  longitude: number | string;
}

export interface PostalAddress extends Thing {
  "@type": "PostalAddress";
  addressCountry?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  streetAddress?: string;
}

export interface Organization extends Thing {
  "@type": "Organization" | "LocalBusiness" | "Store";
  address?: string | PostalAddress;
  telephone?: string;
  email?: string;
  logo?: string | ImageObject;
  geo?: GeoCoordinates;
  hasMap?: string;
  areaServed?: string | Place | AdministrativeArea;
  knowsAbout?: string | string[] | Thing | Thing[];
  hasOfferCatalog?: OfferCatalog;
}

export interface AdministrativeArea extends Thing {
  "@type": "AdministrativeArea";
}

export interface OfferCatalog extends Thing {
  "@type": "OfferCatalog";
  itemListElement: (Offer | ListItem)[];
}

export interface ListItem extends Thing {
  "@type": "ListItem";
  position: number;
  item?: Thing;
}

export interface Product extends Thing {
  "@type": "Product" | "IndividualProduct" | "SomeProducts";
  sku?: string;
  gtin8?: string;
  gtin13?: string;
  brand?: string | Organization;
  offers?: Offer | Offer[];
  model?: string | ProductModel;
  material?: string;
  weight?: string | QuantitativeValue;
  color?: string;
  hasVariant?: Product[];
  variesBy?: string[];
  isLinkedAddon?: boolean;
  parentProductName?: string;
}

export interface ProductGroup extends Thing {
  "@type": "ProductGroup";
  hasVariant: Product[];
  variesBy: string[];
}

export interface ProductModel extends Product {
  "@type": "ProductModel";
}

export interface Service extends Thing {
  "@type": "Service";
  provider?: Organization | Person;
  areaServed?: string | Place | AdministrativeArea;
  offers?: Offer | Offer[];
  hasOfferCatalog?: OfferCatalog;
}

export interface Person extends Thing {
  "@type": "Person";
}

export interface Offer extends Thing {
  "@type": "Offer";
  price: string | number;
  priceCurrency: string;
  availability?: ItemAvailability;
  seller?: Organization;
  itemOffered?: Product | Service;
}

export type ItemAvailability =
  | "https://schema.org/InStock"
  | "https://schema.org/OutOfStock"
  | "https://schema.org/OnlineOnly"
  | "https://schema.org/InStoreOnly"
  | "https://schema.org/PreOrder"
  | "https://schema.org/PreSale"
  | "https://schema.org/LimitedAvailability"
  | "https://schema.org/SoldOut"
  | "https://schema.org/Discontinued";

export interface Order extends Thing {
  "@type": "Order";
  orderedItem: OrderItem[];
  totalPrice: number | string;
  priceCurrency: string;
  seller?: Organization;
  customer?: Person | Organization;
  orderNumber?: string;
  orderStatus?: string;
}

export interface OrderItem extends Thing {
  "@type": "OrderItem";
  orderedItem: Product | Service;
  orderQuantity: number;
  seller?: Organization;
}

export interface JobPosting extends Thing {
  "@type": "JobPosting";
  title: string;
  description: string;
  datePosted?: string;
  validThrough?: string;
  employmentType?: string | string[];
  hiringOrganization?: Organization;
  jobLocation?: Place;
  baseSalary?: PriceSpecification | MonetaryAmount;
}

export interface PriceSpecification extends Thing {
  "@type": "PriceSpecification";
  price: number | string;
  priceCurrency: string;
}

export interface MonetaryAmount extends Thing {
  "@type": "MonetaryAmount";
  value: number | string;
  currency: string;
}
