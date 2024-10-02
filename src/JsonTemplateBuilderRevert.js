import React, { useState, useCallback, useEffect } from 'react';
import { PlusIcon, MinusIcon, TrashIcon, VariableIcon } from '@heroicons/react/solid';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { v4 as uuidv4 } from 'uuid';

const getElementTypeName = (type) => {
  const typeNames = {
    h1: 'Heading 1',
    h2: 'Heading 2',
    h3: 'Heading 3',
    p: 'Paragraph',
    ul: 'Unordered List',
    ol: 'Ordered List',
    span: 'Span',
    strong: 'Strong',
    br: 'Line Break'
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
  BREAK: 'br'
};

const AddElementSidebar = ({ addElement }) => (
  <div className="w-full md:w-64 bg-white shadow-md rounded-lg p-6">
    <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">Add Elements</h2>
    {Object.entries(ElementTypes).map(([key, value]) => (
      <button
        key={key}
        onClick={() => addElement(value)}
        className="block w-full mb-2 text-left text-blue-500 hover:text-blue-700 transition-colors duration-200"
      >
        Add {getElementTypeName(value)}
      </button>
    ))}
  </div>
);

const ListItem = ({ item, index, elementId, modifyListItem, insertVariable, insertBreak, addNestedSpan, updateNestedSpan, removeNestedSpan, canRemove }) => (
  <Draggable draggableId={item.id} index={index} key={item.id}>
    {(provided) => (
      <div
        className="mb-4 p-4 bg-gray-50 rounded-md"
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
      >
        <div className="flex items-center mb-2">
          <span className="mr-2 text-gray-500">{/* List marker is handled in the preview */}</span>
          <input
            value={item.content || ''}
            onChange={(e) => modifyListItem(elementId, item.id, 'content', e.target.value)}
            className="flex-grow p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="List item content"
          />
          {canRemove && (
            <button 
              onClick={() => modifyListItem(elementId, item.id, 'remove')} 
              className="ml-2 text-red-500 hover:text-red-700 transition-colors duration-200"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          )}
        </div>
        <textarea
          value={item.description || ''}
          onChange={(e) => modifyListItem(elementId, item.id, 'description', e.target.value)}
          className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
          placeholder="Item description"
        />
        <div className="mt-2 space-x-2">
          <button onClick={() => insertVariable(elementId, item.id)} className="text-blue-500 hover:text-blue-700 transition-colors duration-200">
            <VariableIcon className="h-5 w-5 inline mr-1" />
            Insert Variable
          </button>
          <button onClick={() => insertBreak(elementId, item.id)} className="text-blue-500 hover:text-blue-700 transition-colors duration-200">
            <VariableIcon className="h-5 w-5 inline mr-1" />
            Add Break
          </button>
        </div>
      </div>
    )}
  </Draggable>
);

const Element = ({
  element,
  index,
  updateElement,
  removeElement,
  modifyListItem,
  insertVariable,
  insertBreak,
  addNestedSpan,
  updateNestedSpan,
  removeNestedSpan
}) => (
  <Draggable draggableId={element.id} index={index} key={element.id}>
    {(provided) => (
      <div
        className="mb-6 p-6 border rounded-lg bg-white shadow-sm transition-all duration-200 hover:shadow-md"
        ref={provided.innerRef}
        {...provided.draggableProps}
      >
        <div className="flex justify-between items-center mb-4" {...provided.dragHandleProps}>
          <h3 className="text-lg font-semibold text-gray-700">{getElementTypeName(element.type)}</h3>
          <button onClick={() => removeElement(element.id)} className="text-red-500 hover:text-red-700 transition-colors duration-200">
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
        {element.type === 'br' ? (
          <p className="text-sm text-gray-500 italic">Line Break (No content)</p>
        ) : ['ul', 'ol'].includes(element.type) ? (
          <>
            <textarea
              value={element.description || ''}
              onChange={(e) => updateElement(element.id, { description: e.target.value })}
              placeholder="List description"
              className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            />
            <Droppable droppableId={element.id} type={`list-${element.id}`}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {element.children && element.children[0] && element.children[0].type === 'array' ? (
                    <div>
                      <textarea
                        value={element.children[0].description || ''}
                        onChange={(e) => updateElement(element.id, { children: [{ ...element.children[0], description: e.target.value }] })}
                        placeholder="Item description"
                        className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                      />
                    </div>
                  ) : (
                    element.children && element.children.map((item, idx) => (
                      <ListItem
                        key={item.id}
                        item={item}
                        index={idx}
                        elementId={element.id}
                        modifyListItem={modifyListItem}
                        insertVariable={insertVariable}
                        insertBreak={insertBreak}
                        addNestedSpan={addNestedSpan}
                        updateNestedSpan={updateNestedSpan}
                        removeNestedSpan={removeNestedSpan}
                        canRemove={element.children.length > 1}
                      />
                    ))
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
            {element.children && element.children[0] && element.children[0].type !== 'array' && (
              <div className="mt-4">
                <button
                  onClick={() => modifyListItem(element.id, null, 'add')}
                  className="text-green-500 hover:text-green-700 transition-colors duration-200"
                >
                  <PlusIcon className="h-5 w-5 inline mr-1" />
                  Add Item
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {element.content !== null ? (
              <input
                value={element.content || ''}
                onChange={(e) => updateElement(element.id, { content: e.target.value })}
                className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <textarea
                value={element.description || ''}
                onChange={(e) => updateElement(element.id, { description: e.target.value })}
                placeholder="Description/Instructions for AI"
                className="w-full p-2 mt-4 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
            {element.children && element.children.length > 0 && (
              <div className="mt-4 pl-4 border-l-2 border-gray-200">
                {element.children.map((child, idx) => (
                  <Element
                    key={child.id || idx}
                    element={child}
                    index={idx}
                    updateElement={(id, updates) => updateElement(element.id, { children: element.children.map(c => c.id === id ? { ...c, ...updates } : c) })}
                    removeElement={(id) => updateElement(element.id, { children: element.children.filter(c => c.id !== id) })}
                    modifyListItem={modifyListItem}
                    insertVariable={insertVariable}
                    insertBreak={insertBreak}
                    addNestedSpan={addNestedSpan}
                    updateNestedSpan={updateNestedSpan}
                    removeNestedSpan={removeNestedSpan}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    )}
  </Draggable>
);

const JsonTemplateBuilderRevert = () => {
  const [elements, setElements] = useState([]);
  const [jsonSchema, setJsonSchema] = useState(JSON.stringify({ schema: { properties: { tag: { enum: ['body'] }, children: [] } } }, null, 2));

  useEffect(() => {
    setJsonSchema(JSON.stringify(convertToJsonSchema(), null, 2));
  }, [elements]);

  const addElement = useCallback((type) => {
    setElements((prev) => [
      ...prev,
      {
        id: uuidv4(),
        type,
        content: type === 'br' ? null : '',
        description: '',
        children: ['ul', 'ol'].includes(type) ? [{ type: 'array', description: '' }] : []
      }
    ]);
  }, []);

  const removeElement = useCallback((id) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
  }, []);

  const updateElement = useCallback((id, updates) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id === id) {
          return { ...el, ...updates };
        }
        return el;
      })
    );
  }, []);

  const modifyListItem = useCallback((elementId, itemId, action, value = '') => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id === elementId) {
          let newChildren = [...el.children];
          if (action === 'add') {
            newChildren.push({ id: uuidv4(), content: '', description: '' });
          } else if (action === 'remove') {
            if (newChildren.length > 1) {
              newChildren = newChildren.filter((item) => item.id !== itemId);
            }
          } else if (['content', 'description'].includes(action)) {
            newChildren = newChildren.map((item) => (item.id === itemId ? { ...item, [action]: value } : item));
          }
          return { ...el, children: newChildren };
        }
        return el;
      })
    );
  }, []);

  const insertVariable = useCallback((id, itemId = null) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id === id) {
          if (itemId) {
            const newChildren = el.children.map((item) =>
              item.id === itemId ? { ...item, content: `${item.content} {{Variable Name}}` } : item
            );
            return { ...el, children: newChildren };
          } else {
            return { ...el, content: `${el.content} {{Variable Name}}` };
          }
        }
        return el;
      })
    );
  }, []);

  const insertBreak = useCallback((id, itemId = null) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id === id) {
          if (itemId) {
            const newChildren = el.children.map((item) =>
              item.id === itemId ? { ...item, content: `${item.content}<br>` } : item
            );
            return { ...el, children: newChildren };
          } else {
            return { ...el, content: `${el.content}<br>` };
          }
        }
        return el;
      })
    );
  }, []);

  const handleDragEnd = (result) => {
    const { destination, source, type } = result;

    if (!destination) return;

    if (type === 'ELEMENT') {
      const reorderedElements = Array.from(elements);
      const [movedElement] = reorderedElements.splice(source.index, 1);
      reorderedElements.splice(destination.index, 0, movedElement);
      setElements(reorderedElements);
    } else if (type.startsWith('list-')) {
      const elementId = type.split('-')[1];
      setElements((prev) =>
        prev.map((el) => {
          if (el.id === elementId) {
            const reorderedItems = Array.from(el.children);
            const [movedItem] = reorderedItems.splice(source.index, 1);
            reorderedItems.splice(destination.index, 0, movedItem);
            return { ...el, children: reorderedItems };
          }
          return el;
        })
      );
    }
  };

  const convertToJsonSchema = () => ({
    schema: {
      properties: {
        tag: { enum: ['body'] },
        children: elements.map((element) => {
          const baseProps = { tag: { enum: [element.type] } };

          if (element.type === 'br') {
            return { properties: baseProps };
          }

        if (['ul', 'ol'].includes(element.type)) {
  return {
    ...(element.description ? { description: element.description } : {}),
    properties: {
      ...baseProps,
      children: element.children[0].type === 'array'
        ? [
            {
              type: 'array',
              description: element.children[0].description || "",
              items: {
                properties: {
                  tag: { enum: ['li'] },
                  children: null
                }
              }
            }
          ]
        : element.children.map(item => ({
            ...(item.description ? { description: item.description } : {}),
            properties: {
              tag: { enum: ['li'] },
              ...(item.content ? { content: { enum: [item.content] } } : {}),
              children: item.children ? convertChildren(item.children) : null
            }
          }))
    }
  };
}

const elementProps = {
  ...baseProps,
  ...(element.content !== null ? { content: { enum: [element.content] } } : { content: null }),
  children: element.children ? convertChildren(element.children) : null
};

return { 
  ...(element.description ? { description: element.description } : {}),
  properties: elementProps 
};
})
}
});

const convertChildren = (children) => {
if (!children || children.length === 0) return null;
return children.map(child => ({
...(child.description ? { description: child.description } : {}),
properties: {
  tag: { enum: [child.type] },
  ...(child.content !== null ? { content: { enum: [child.content] } } : { content: null }),
  children: child.children ? convertChildren(child.children) : null
}
}));
};

const updateElementsFromSchema = () => {
try {
const parsedSchema = JSON.parse(jsonSchema);
const newElements = parsedSchema.schema.properties.children.map(convertSchemaToElement);
setElements(newElements);
} catch (error) {
console.error('Error parsing JSON schema:', error);
alert('Invalid JSON schema. Please check your input.');
}
};

const convertSchemaToElement = (child) => {
const type = child.properties.tag.enum[0];
const baseElement = {
id: uuidv4(),
type,
description: child.description || '',
content: child.properties.content?.enum?.[0] ?? null,
children: []
};

if (['ul', 'ol'].includes(type)) {
if (child.properties.children[0].type === 'array') {
  baseElement.children = [
    {
      type: 'array',
      description: child.properties.children[0].description || ''
    }
  ];
} else {
  baseElement.children = child.properties.children.map(convertSchemaToElement);
}
} else if (child.properties.children) {
baseElement.children = child.properties.children.map(convertSchemaToElement);
}

return baseElement;
};

const renderPreview = () => (
<div className="p-5 bg-gray-100 rounded mb-5 text-gray-800">
{elements.map((element, index) => {
if (['ul', 'ol'].includes(element.type)) {
  const ListComponent = element.type === 'ul' ? 'ul' : 'ol';
  return (
    <div key={index}>
      <p className="italic mb-2">List description: {element.description}</p>
      <ListComponent className={`mb-4 pl-5 ${element.type === 'ul' ? 'list-disc' : 'list-decimal'}`}>
        {element.children[0].type === 'array' ? (
          <li className="italic text-gray-600">Dynamic list items: {element.children[0].description}</li>
        ) : (
          element.children.map((item, idx) => (
            <li key={idx} className="mb-2">
              {item.content || (item.description && <span className="italic text-gray-600">Generated content for: {item.description}</span>)}
            </li>
          ))
        )}
      </ListComponent>
    </div>
  );
}

switch (element.type) {
  case 'br':
    return <hr key={index} className="my-4 border-t border-gray-300" />;
  case 'h1':
    return <h1 key={index} className="text-4xl font-bold mb-4">{element.content}</h1>;
  case 'h2':
    return <h2 key={index} className="text-3xl font-semibold mb-3">{element.content}</h2>;
  case 'h3':
    return <h3 key={index} className="text-2xl font-medium mb-2">{element.content}</h3>;
  case 'p':
    return (
      <p key={index} className="mb-4">
        {element.content || (element.description && <span className="italic text-gray-600">Generated content for: {element.description}</span>)}
        {element.children && element.children.map((child, childIndex) => {
          switch (child.type) {
            case 'span':
              return <span key={childIndex}>{child.content || (child.description && <span className="italic text-gray-600">Generated content for: {child.description}</span>)}</span>;
            case 'strong':
              return <strong key={childIndex}>{child.content || (child.description && <span className="italic text-gray-600">Generated content for: {child.description}</span>)}</strong>;
            default:
              return null;
          }
        })}
      </p>
    );
  default:
    return <p key={index} className="mb-4">{element.content || element.description}</p>;
}
})}
</div>
);

return (
<div className="font-sans p-8 bg-gray-100 min-h-screen">
<div className="max-w-7xl mx-auto">
  <h1 className="text-3xl font-bold text-gray-800 mb-8">JSON Template Builder</h1>
  <DragDropContext onDragEnd={handleDragEnd}>
    <div className="flex flex-col md:flex-row gap-8">
      <AddElementSidebar addElement={addElement} />
      <div className="flex-1">
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">Template Builder</h2>
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
                    modifyListItem={modifyListItem}
                    insertVariable={insertVariable}
                    insertBreak={insertBreak}
                    addNestedSpan={addNestedSpan}
                    updateNestedSpan={updateNestedSpan}
                    removeNestedSpan={removeNestedSpan}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">Human-Readable Preview</h2>
          {renderPreview()}
        </div>
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">JSON Schema</h2>
          <textarea
            value={jsonSchema}
            onChange={(e) => setJsonSchema(e.target.value)}
            className="w-full h-[300px] p-2 font-mono text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={updateElementsFromSchema}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-200"
          >
            Update Template
          </button>
        </div>
      </div>
    </div>
  </DragDropContext>
</div>
</div>
);
};

export default JsonTemplateBuilderRevert;