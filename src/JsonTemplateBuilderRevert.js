
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { PlusIcon, TrashIcon, VariableIcon, MenuIcon } from '@heroicons/react/solid';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { v4 as uuidv4 } from 'uuid';

// Utility function to map tag names to human-readable labels
const getElementTypeName = (type) => {
  const typeNames = {
    h1: 'Heading 1',
    h2: 'Heading 2',
    h3: 'Heading 3',
    p: 'Paragraph',
    ul: 'Unordered List (Bullet Points)',
    ol: 'Ordered List (Numbered List)',
    span: 'Span (Continuous Text)',
    strong: 'Strong (Bold Text)',
    br: 'Line Break'
  };
  return typeNames[type] || type.toUpperCase();
};

// Sidebar to add elements
const AddElementSidebar = ({ addElement }) => {
  const visibleElements = {
    PARAGRAPH: 'p',
    UNORDERED_LIST: 'ul',
    ORDERED_LIST: 'ol',
    BREAK: 'br',
    SPAN: 'span'
  };

  return (
    <div className="w-full md:w-64 bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">Add Elements</h2>
      {Object.entries(visibleElements).map(([key, value]) => (
        <button
          key={key}
          onClick={() => addElement(value)}
          className="block w-full mb-2 text-left text-blue-500 hover:text-blue-700 transition-colors duration-200"
        >
          Add {key.replace(/_/g, ' ')}
        </button>
      ))}
    </div>
  );
};

// Render preview
const renderPreview = (elements) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">Preview</h2>
      <div className="space-y-4">
        {elements.map((element, index) => {
          if (element.type === 'p') {
            return (
              <div key={index} className="mb-6">
                {element.content && (
                  <div className="font-semibold">
                    <span>{element.content}</span>
                  </div>
                )}
                <div className="mt-2 ml-4">
                  {element.childContent ? (
                    <span>{element.childContent}</span>
                  ) : element.childDescription ? (
                    <span className="text-gray-600 italic">
                      Generated content for Prompt: "{element.childDescription}"
                    </span>
                  ) : null}
                </div>
              </div>
            );
          }

          if (element.type === 'br') {
            return <br key={index} />;
          }

          if (element.type === 'span') {
            return (
              <div key={index} className="mb-4">
                <span className="text-gray-800">{element.content}</span>
              </div>
            );
          }

          if (['ul', 'ol'].includes(element.type)) {
            const ListTag = element.type;
            return (
              <div key={index} className="mb-6">
                {element.content && (
                  <div className="font-semibold">
                    <span>{element.content}</span>
                  </div>
                )}
                <div className="mt-2">
                  {element.isDynamic ? (
                    <div className="ml-4 text-gray-600 italic">
                      Generated dynamic list for Prompt: "{element.dynamicListDescription}"
                    </div>
                  ) : (
                    <ListTag className={\`pl-5 \${element.type === 'ul' ? 'list-disc' : 'list-decimal'}\`}>
                      {element.contentItems.map((item, itemIndex) => (
                        <li key={itemIndex}>
                          {item.content ? (
                            <span>{item.content}</span>
                          ) : item.description ? (
                            <span className="text-gray-600 italic">
                              Generated content for Prompt: "{item.description}"
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ListTag>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div key={index}>
              {element.content ? (
                <span>{element.content}</span>
              ) : element.description ? (
                <span className="text-gray-600 italic">
                  Generated content for Prompt: "{element.description}"
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// JSON schema builder
const sanitizeContent = (content) => {
  if (!content) return null;
  return content.replace(/\n/g, "").trim();
};

const convertToJsonSchema = (elements) => {
  const sanitizeContent = (content) => {
    if (!content) return "";
    return content.replace(/\n/g, "").trim();
  };

  return {
    schema: {
      description: "Ensure that only the required data fields specified in the template are generated, strictly adhering to the provided element structure.",
      properties: {
        tag: { enum: ["body"] },
        content: null,
        children: elements.flatMap((element, index) => {
          const groupId = \`group\${index + 1}\`;
          const groupElements = [];

          const createAttributes = () => [{
            properties: {
              name: { enum: ["id"] },
              value: { enum: [groupId] }
            }
          }];

          if (element.content) {
            const sanitizedContent = sanitizeContent(element.content);
            if (sanitizedContent) {
              groupElements.push({
                properties: {
                  tag: { enum: ["p"] },
                  attributes: [{
                    properties: {
                      name: { enum: ["data-related-id"] },
                      value: { enum: [groupId] }
                    }
                  }],
                  content: { enum: [sanitizedContent] },
                  children: null,
                },
              });
            }
          }

          if (["ul", "ol"].includes(element.type)) {
            const listElement = {
              description: "Follow the instructions mentioned in List description",
              properties: {
                tag: { enum: [element.type] },
                attributes: createAttributes(),
                content: null,
                children: element.isDynamic
                  ? [{
                      type: "array",
                      items: {
                        properties: {
                          tag: { enum: ["li"] },
                          attributes: createAttributes(),
                          content: { description: sanitizeContent(element.dynamicListDescription) },
                          children: null,
                        },
                      },
                    }]
                  : element.contentItems.map(item => ({
                      properties: {
                        tag: { enum: ["li"] },
                        attributes: createAttributes(),
                        content: item.description 
                          ? { description: sanitizeContent(item.description) }
                          : { enum: [sanitizeContent(item.content)] },
                        children: null,
                      }
                    }))
              }
            };
            groupElements.push(listElement);

          } else if (element.type === 'p') {
            if (element.childContent) {
              const sanitizedChildContent = sanitizeContent(element.childContent);
              if (sanitizedChildContent) {
                groupElements.push({
                  properties: {
                    tag: { enum: ["div"] },
                    attributes: createAttributes(),
                    content: { enum: [sanitizedChildContent] },
                    children: null,
                  },
                });
              }
            }

            if (element.childDescription) {
              const sanitizedChildDesc = sanitizeContent(element.childDescription);
              if (sanitizedChildDesc) {
                groupElements.push({
                  properties: {
                    tag: { enum: ["p"] },
                    attributes: createAttributes(),
                    content: { description: sanitizedChildDesc },
                    children: null,
                  },
                });
              }
            }

          } else if (element.type === 'br') {
            groupElements.push({
              properties: {
                tag: { enum: ["br"] },
                attributes: createAttributes(),
                content: null,
                children: null,
              },
            });
          } else {
            const sanitizedContent = sanitizeContent(element.content);
            const sanitizedDesc = sanitizeContent(element.description);
            if (sanitizedContent || sanitizedDesc) {
              groupElements.push({
                properties: {
                  tag: { enum: [element.type] },
                  attributes: createAttributes(),
                  content: sanitizedDesc 
                    ? { description: sanitizedDesc }
                    : sanitizedContent 
                      ? { enum: [sanitizedContent] }
                      : null,
                  children: null,
                },
              });
            }
          }

          return groupElements;
        }),
      },
    },
  };
};

// Exported main builder
const JsonTemplateBuilderRevert = () => {
  const [elements, setElements] = useState([]);
  const [jsonSchema, setJsonSchema] = useState(JSON.stringify({ schema: { properties: { tag: { enum: ['body'] }, children: [] } } }, null, 2));

  useEffect(() => {
    setJsonSchema(JSON.stringify(convertToJsonSchema(elements), null, 2));
  }, [elements]);

  const addElement = useCallback((type) => {
    setElements((prev) => [
      ...prev,
      {
        id: uuidv4(),
        type,
        content: '',
        contentItems: ['ul', 'ol'].includes(type) ? [] : undefined,
        childContent: type === 'p' ? '' : undefined,
        childDescription: null,
        description: ['ul', 'ol'].includes(type) ? '' : null,
        isDynamic: ['ul', 'ol'].includes(type),
        dynamicListDescription: '',
        listItemDescription: null,
        hasDescription: ['ul', 'ol'].includes(type)
      }
    ]);
  }, []);

  return (
    <div className="font-sans p-8 pb-32 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">JSON Template Builder</h1>
        <DragDropContext onDragEnd={() => {}}>
          <div className="flex flex-col md:flex-row gap-8">
            <AddElementSidebar addElement={addElement} />
            <div className="flex-1">
              <div className="bg-white shadow-md rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">Template Builder</h2>
                {/* Render logic omitted for brevity */}
              </div>
              {renderPreview(elements)}
              <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">JSON Schema</h2>
                <textarea
                  value={jsonSchema}
                  onChange={(e) => setJsonSchema(e.target.value)}
                  className="w-full h-[300px] p-2 font-mono text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </DragDropContext>
      </div>
    </div>
  );
};

export default JsonTemplateBuilderRevert;
