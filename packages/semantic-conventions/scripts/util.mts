import type { AttributeDescription, ConventionSchema } from './autogen.mts';

type AttributeWithKeyName = AttributeDescription & { keyName: string };

/**
 * Extract flatten array of attributes (with no subAttributes)
 * @param attributeObject domain object containing all related sub attributes with their names
 * @returns Array of flatten Attributes with extended key name property
 */
export function getAllPropertyNames(attributeObject: ConventionSchema): AttributeWithKeyName[] {
  const attributesNameList: AttributeWithKeyName[] = [];

  const subAttributes = Object.entries(attributeObject.content.subAttributes!).map<AttributeWithKeyName>(([key, value]) => ({
    ...value,
    keyName: `${attributeObject.domain}.${key}`,
  }));

  // iterate till extract all flatten attributes (without subAttributes)
  while (subAttributes.length > 0) {
    const includedAttributes = subAttributes.pop();

    if (!includedAttributes?.subAttributes) {
      attributesNameList.push(includedAttributes!);
      continue;
    }

    // Add the right key value per - key based on object hierarchy.
    const currentSubAttributes = Object.entries(includedAttributes.subAttributes).map<AttributeWithKeyName>(([key, value]) => ({
      ...value,
      keyName: [includedAttributes.keyName, key].join('.'),
    }));
    subAttributes.push(...currentSubAttributes);
  }

  return attributesNameList;
}
