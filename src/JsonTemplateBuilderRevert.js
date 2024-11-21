import React, { useState, useCallback, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { v4 as uuidv4 } from 'uuid';

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
    br: 'Line Break',
  };
  return typeNames[type] || type.toUpperCase();
};

const ElementTypes = {
  HEADING1: 'h1',
  HEADING2: 'h2',
  HEADING3: 'h3',
  PARAGRAPH: 'p',
  UNORDERED_LIST: 'ul',
  ORDERED_LIST: 'ol',
  SPAN: 'span',
  STRONG: 'strong',
  BREAK: 'br',
};

const defaultContent = {
  ul: [{ id: uuidv4(), content: 'List item 1' }],
  ol: [{ id: uuidv4(), content: 'List item 1' }],
  br: '',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  p: 'Paragraph text',
  strong: 'Bold text',
  span: 'Span text',
};

const JsonTemplateBuilder = () => {
  const [elements, setElements] = useState([]);
  const [jsonSchema, setJsonSchema] = useState('{}');
  const [groups, setGroups] = useState([]);

  // Add a new element
  const addElement = useCallback((type) => {
    setElements((prev) => [
      ...prev,
      {
        id: uuidv4(),
        type,
        content: defaultContent[type] || 'New element',
        group: '', // Group initially unassigned
      },
    ]);
  }, []);

  // Assign group to an element
  const assignGroup = useCallback((id, groupName) => {
    setElements((prev) =>
      prev.map((el) =>
        el.id === id
          ? {
              ...el,
              group: groupName,
            }
          : el
      )
    );

    if (groupName && !groups.includes(groupName)) {
      setGroups((prevGroups) => [...prevGroups, groupName]);
    }
  }, [groups]);

  // Remove an element
  const removeElement = useCallback((id) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
  }, []);

  // Update JSON schema whenever elements change
  useEffect(() => {
    const schema = {
      schema: {
        properties: {
          children: elements.map((el) => ({
            tag: el.type,
            content: el.content,
            ...(el.group ? { group: el.group } : {}),
          })),
        },
      },
    };
    setJsonSchema(JSON.stringify(schema, null, 2));
  }, [elements]);

  return (
    <div className="font-sans p-8 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">JSON Template Builder with Grouping</h1>
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">
            Add Elements
          </h2>
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
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">
            Template Builder
          </h2>
          <DragDropContext onDragEnd={() => {}}>
            <Droppable droppableId="elements" type="ELEMENT">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {elements.map((element, index) => (
                    <Draggable key={element.id} draggableId={element.id} index={index}>
                      {(provided) => (
                        <div
                          className="mb-6 p-6 border rounded-lg bg-white shadow-sm transition-all duration-200 hover:shadow-md"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                        >
                          <div className="flex justify-between items-center mb-4" {...provided.dragHandleProps}>
                            <h3 className="text-lg font-semibold text-gray-700">
                              {getElementTypeName(element.type)}
                            </h3>
                            <button
                              onClick={() => removeElement(element.id)}
                              className="p-1 text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                          <textarea
                            value={element.content}
                            onChange={(e) =>
                              setElements((prev) =>
                                prev.map((el) =>
                                  el.id === element.id ? { ...el, content: e.target.value } : el
                                )
                              )
                            }
                            className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                            placeholder="Element content"
                          />
                          <select
                            value={element.group}
                            onChange={(e) => assignGroup(element.id, e.target.value)}
                            className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Group</option>
                            {groups.map((group, idx) => (
                              <option key={idx} value={group}>
                                {group}
                              </option>
                            ))}
                            <option value="New Group">+ Create New Group</option>
                          </select>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">
            JSON Schema
          </h2>
          <textarea
            value={jsonSchema}
            readOnly
            className="w-full h-[300px] p-2 font-mono text-sm border rounded focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default JsonTemplateBuilder;
