import React, { useState, useCallback, useEffect } from 'react';
import { PlusIcon, TrashIcon, MenuIcon } from '@heroicons/react/solid';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { v4 as uuidv4 } from 'uuid';

/**
 * Utility function to map HTML tag types to readable names.
 */
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

/**
 * Enumeration of supported element types.
 */
const ElementTypes = {
  HEADING1: 'h1',
  HEADING2: 'h2',
  HEADING3: 'h3',
  PARAGRAPH: 'p',
  UNORDERED_LIST: 'ul',
  ORDERED_LIST: 'ol',
  SPAN: 'span',
  STRONG: 'strong',
  BREAK: 'br'
};

/**
 * Default content for each element type.
 */
const defaultContent = {
  ul: [{ id: uuidv4(), content: 'List item 1', description: null, nestedSpans: [] }],
  ol: [{ id: uuidv4(), content: 'List item 1', description: null, nestedSpans: [] }],
  br: '',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  p: 'Paragraph text',
  strong: 'Bold text',
  span: 'Span text'
};

/**
 * Sidebar component to add new elements to the template.
 */
const AddElementSidebar = ({ addElement }) => (
  <div className="w-full md:w-64 bg-white shadow-md rounded-lg p-6">
    <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">Add Elements</h2>
    {Object.entries(ElementTypes).map(([key, value]) => (
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

/**
 * Component for formatted input.
 */
const FormattedInput = ({ value, onChange, placeholder, onRemove }) => (
  <div className="relative">
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 h-16"
      placeholder={placeholder}
    />
    <div className="flex space-x-2 mb-2">
      {onRemove && (
        <button onClick={onRemove} className="p-1 text-red-500 hover:text-red-700">
          <TrashIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  </div>
);

/**
 * Component representing a single element (e.g., heading, paragraph, list) in the template.
 */
const Element = ({
  element,
  index,
  updateElement,
  removeElement
}) => {
  return (
    <Draggable draggableId={element.id} index={index} key={element.id}>
      {(provided) => (
        <div
          className="mb-6 p-6 border rounded-lg bg-white shadow-sm transition-all duration-200 hover:shadow-md"
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">{getElementTypeName(element.type)}</h3>
            <button onClick={() => removeElement(element.id)} className="p-1 text-red-500 hover:text-red-700">
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
          <FormattedInput
            value={element.content}
            onChange={(value) => updateElement(element.id, { content: value })}
            placeholder={`${getElementTypeName(element.type)} content`}
          />
          {/* Render Nested Children */}
          {element.children && element.children.length > 0 && (
            <div className="ml-4 mt-4">
              {element.children.map((child, idx) => (
                <Element
                  key={child.id}
                  element={child}
                  index={idx}
                  updateElement={(childId, updates) => {
                    updateElement(element.id, {
                      children: element.children.map((childEl) =>
                        childEl.id === childId ? { ...childEl, ...updates } : childEl
                      ),
                    });
                  }}
                  removeElement={(childId) => {
                    updateElement(element.id, {
                      children: element.children.filter((childEl) => childEl.id !== childId),
                    });
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

/**
 * Main component for building the JSON template with drag-and-drop functionality.
 */
const JsonTemplateBuilderRevert = () => {
  const [elements, setElements] = useState([]);
  const [jsonSchema, setJsonSchema] = useState(
    JSON.stringify({ schema: { properties: { tag: { enum: ['body'] }, children: [] } } }, null, 2)
  );

  /**
   * Update the JSON schema whenever the elements state changes.
   */
  useEffect(() => {
    setJsonSchema(JSON.stringify(convertToJsonSchema(), null, 2));
  }, [elements]);

  /**
   * Adds a new element to the template.
   */
  const addElement = useCallback((type) => {
    setElements((prev) => [
      ...prev,
      {
        id: uuidv4(),
        type,
        content: defaultContent[type] || 'New element',
        description: null,
        children: [],
      }
    ]);
  }, []);

  /**
   * Removes an element from the template.
   */
  const removeElement = useCallback((id) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
  }, []);

  /**
   * Updates properties of a specific element.
   */
  const updateElement = useCallback((id, updates) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  }, []);

  /**
   * Handles the drag-and-drop events.
   */
  const handleDragEnd = (result) => {
    const { destination, source } = result;

    if (!destination) return;

    const newElements = Array.from(elements);
    const [movedElement] = newElements.splice(source.index, 1);

    // If the destination is at a different index within the same level, reorder
    if (destination.index !== source.index) {
      newElements.splice(destination.index, 0, movedElement);
    } else if (destination.droppableId !== source.droppableId) {
      // If dropping onto another element, make it a child
      const parentElementIndex = newElements.findIndex(el => el.id === destination.droppableId);
      newElements[parentElementIndex].children.push(movedElement);
    }

    setElements(newElements);
  };

  /**
   * Converts the current template elements to a JSON schema.
   */
  const convertToJsonSchema = () => ({
    schema: {
      description:
        'Ensure that only the required data fields specified in the template are generated, strictly adhering to the provided element structure. Do not include any additional labels, headers, context, or text that falls outside the defined elements.',
      properties: {
        tag: { enum: ['body'] },
        children: elements.map((element) => convertElementToSchema(element)),
      },
    },
  });

  const convertElementToSchema = (element) => {
    const baseProps = { tag: { enum: [element.type] } };

    if (element.children && element.children.length > 0) {
      return {
        properties: {
          ...baseProps,
          content: element.content.trim() !== '' ? { enum: [element.content] } : undefined,
          children: element.children.map((child) => convertElementToSchema(child)),
        },
      };
    }

    return {
      properties: {
        ...baseProps,
        content: element.content.trim() !== '' ? { enum: [element.content] } : undefined,
        children: null,
      },
    };
  };

  return (
    <div className="font-sans p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">JSON Template Builder</h1>
        <div className="flex flex-col md:flex-row gap-8">
          <AddElementSidebar addElement={addElement} />
          <div className="flex-1">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="elements" type="ELEMENT">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {elements.map((element, index) => (
                      <Element
                        key={element.id}
                        element={element}
                        index={index}
                        updateElement={updateElement}
                        removeElement={removeElement}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">JSON Schema</h2>
          <textarea
            value={jsonSchema}
            onChange={(e) => setJsonSchema(e.target.value)}
            className="w-full h-[300px] p-2 font-mono text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default JsonTemplateBuilderRevert;
